/**
 * Bali Catering Service — Restaurant Context
 * -------------------------------------------------
 * Re-exports from the new database-backed AppContext.
 *
 * This file is kept as a compatibility bridge so that all existing
 * components can continue importing { useRestaurant, RestaurantProvider,
 * AdminSubView } from '../../context/RestaurantContext' without changes,
 * while the actual implementation lives in AppContext.tsx (API/SQLite-backed).
 */

export { RestaurantProvider, useRestaurant } from './AppContext';
export type { AdminSubView } from './AppContext';
