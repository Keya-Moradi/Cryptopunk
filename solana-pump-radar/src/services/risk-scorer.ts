import { Connection, PublicKey } from '@solana/web3.js';
import { getMint, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { logger } from '../logger';
import { config } from '../config';

export interface RiskReport {
  mint: string;
  score: number; // 0-100
  label: 'LOW' | 'MED' | 'HIGH';
  reasons: string[];
  authorities: {
    mintAuthority: string | null;
    freezeAuthority: string | null;
  };
  topHolders: Array<{
    address: string;
    percentage: number;
  }>;
}

const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

/**
 * Compute risk score for a token mint
 */
export async function computeRiskScore(mint: string): Promise<RiskReport> {
  const connection = new Connection(config.solanaRpcUrl, 'confirmed');
  const mintPubkey = new PublicKey(mint);

  let score = 0;
  const reasons: string[] = [];
  let authorities = {
    mintAuthority: null as string | null,
    freezeAuthority: null as string | null,
  };
  let topHolders: Array<{ address: string; percentage: number }> = [];

  try {
    // Get mint info
    const mintInfo = await getMint(connection, mintPubkey, 'confirmed', TOKEN_PROGRAM_ID);

    authorities = {
      mintAuthority: mintInfo.mintAuthority?.toBase58() || null,
      freezeAuthority: mintInfo.freezeAuthority?.toBase58() || null,
    };

    // Risk factor: Mint authority exists (can print unlimited tokens)
    if (mintInfo.mintAuthority) {
      score += 35;
      reasons.push('Mint authority is active - creator can mint unlimited tokens');
    } else {
      reasons.push('Mint authority is revoked (good)');
    }

    // Risk factor: Freeze authority exists (can freeze holder accounts)
    if (mintInfo.freezeAuthority) {
      score += 25;
      reasons.push('Freeze authority is active - creator can freeze accounts');
    } else {
      reasons.push('Freeze authority is revoked (good)');
    }

    // Get top holders and compute concentration
    try {
      const largestAccounts = await connection.getTokenLargestAccounts(mintPubkey, 'confirmed');
      const totalSupply = Number(mintInfo.supply);

      if (totalSupply > 0) {
        const sortedAccounts = largestAccounts.value.sort((a, b) => Number(b.amount) - Number(a.amount));

        let topHolderPct = 0;
        let top5Pct = 0;

        topHolders = sortedAccounts.slice(0, 5).map((account, idx) => {
          const pct = (Number(account.amount) / totalSupply) * 100;
          if (idx === 0) topHolderPct = pct;
          if (idx < 5) top5Pct += pct;

          return {
            address: account.address.toBase58(),
            percentage: pct,
          };
        });

        // Risk factor: Top holder concentration
        if (topHolderPct > 50) {
          score += 30;
          reasons.push(`Extreme holder concentration: top holder owns ${topHolderPct.toFixed(1)}%`);
        } else if (topHolderPct > 30) {
          score += 20;
          reasons.push(`High holder concentration: top holder owns ${topHolderPct.toFixed(1)}%`);
        } else if (topHolderPct > 15) {
          score += 10;
          reasons.push(`Moderate holder concentration: top holder owns ${topHolderPct.toFixed(1)}%`);
        } else {
          reasons.push(`Distributed ownership: top holder owns ${topHolderPct.toFixed(1)}%`);
        }

        // Additional risk: Top 5 holders
        if (top5Pct > 80) {
          score += 10;
          reasons.push(`Top 5 holders control ${top5Pct.toFixed(1)}% of supply`);
        }
      }
    } catch (error) {
      logger.warn({ error, mint }, 'Could not fetch token largest accounts');
      reasons.push('Unable to verify holder distribution');
      score += 10; // Add uncertainty penalty
    }

    // Check for metadata (optional - absence is suspicious but not necessarily a rug)
    try {
      const [metadataPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('metadata'), METADATA_PROGRAM_ID.toBuffer(), mintPubkey.toBuffer()],
        METADATA_PROGRAM_ID
      );

      const accountInfo = await connection.getAccountInfo(metadataPDA, 'confirmed');
      if (!accountInfo) {
        score += 5;
        reasons.push('No Metaplex metadata found (unusual)');
      } else {
        reasons.push('Metaplex metadata exists');
      }
    } catch (error) {
      logger.warn({ error, mint }, 'Could not check metadata account');
    }

    // Determine label
    let label: 'LOW' | 'MED' | 'HIGH';
    if (score >= 60) {
      label = 'HIGH';
    } else if (score >= 30) {
      label = 'MED';
    } else {
      label = 'LOW';
    }

    return {
      mint,
      score: Math.min(score, 100),
      label,
      reasons,
      authorities,
      topHolders,
    };
  } catch (error) {
    logger.error({ error, mint }, 'Failed to compute risk score');

    // Return high-risk default on error
    return {
      mint,
      score: 90,
      label: 'HIGH',
      reasons: ['Error fetching token data - cannot verify safety'],
      authorities,
      topHolders,
    };
  }
}