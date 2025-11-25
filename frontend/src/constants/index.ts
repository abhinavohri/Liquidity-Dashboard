/**
 * Application-wide constants
 */

// ============================================================================
// API Configuration
// ============================================================================

/**
 * Request timeout in milliseconds (30 seconds)
 */
export const API_TIMEOUT_MS = 30000;

/**
 * Maximum number of items to fetch in a single request
 */
export const API_MAX_LIMIT = 1000;

// ============================================================================
// React Query Cache Configuration
// ============================================================================

/**
 * Default stale time for liquidations queries (3 minutes)
 */
export const QUERY_STALE_TIME_LIQUIDATIONS = 1000 * 60 * 3;

/**
 * Default stale time for analytics queries (5 minutes)
 */
export const QUERY_STALE_TIME_ANALYTICS = 1000 * 60 * 5;

/**
 * Default garbage collection time for queries (10 minutes)
 */
export const QUERY_GC_TIME = 1000 * 60 * 10;

/**
 * Maximum retry delay for failed queries (30 seconds)
 */
export const QUERY_MAX_RETRY_DELAY = 30000;

// ============================================================================
// External Services
// ============================================================================

/**
 * Base URL for Trust Wallet token icons
 */
export const TRUST_WALLET_ASSETS_URL =
  'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/';

// ============================================================================
// Blockchain Configuration
// ============================================================================

/**
 * Default start block for indexing (if not specified)
 */
export const DEFAULT_START_BLOCK = 23000000;

// ============================================================================
// UI Configuration
// ============================================================================

/**
 * Available time filters for analytics
 */
export const TIME_FILTERS = ['1w', '1m', '1y', 'max'] as const;
export type TimeFilter = (typeof TIME_FILTERS)[number];

/**
 * Available chains (currently only Aave)
 */
export const AVAILABLE_CHAINS = ['Aave'] as const;

/**
 * Default pagination rows per page options
 */
export const PAGINATION_OPTIONS = [10, 25, 100] as const;

/**
 * Default rows per page
 */
export const DEFAULT_ROWS_PER_PAGE = 10;
