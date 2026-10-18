export interface IIgnoredUsersManager
{
    init(): void;
    requestIgnoredUsers(): void;
    ignoreUser(userId: number): void;
    unignoreUser(userId: number): void;
    isIgnored(userId: number): boolean;

    /**
     * Returns the current ignored user ids as a frozen, referentially
     * stable array. The same reference is returned across reads until
     * the list is mutated; mutations dispatch
     * `OctaneEventType.IGNORED_USERS_UPDATED` to signal invalidation.
     *
     * Pairs with `useSyncExternalStore` on the React client.
     */
    getIgnoredUsersSnapshot(): ReadonlyArray<number>;
}
