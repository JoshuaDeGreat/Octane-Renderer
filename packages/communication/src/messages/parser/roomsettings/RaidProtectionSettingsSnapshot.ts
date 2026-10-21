/**
 * AIR package_230/RaidProtectionSettingsSnapshot: a room's raid protection settings, whether a raid
 * is going on and when the last one started (unix seconds, 0 for never).
 */
export class RaidProtectionSettingsSnapshot
{
    public static SENSITIVITY_LOW: number = 0;
    public static SENSITIVITY_MEDIUM: number = 1;
    public static SENSITIVITY_HIGH: number = 2;
    public static ACTION_KICK: number = 0;
    public static ACTION_TEMPORARY_BAN: number = 1;

    constructor(
        public readonly roomId: number,
        public readonly enabled: boolean,
        public readonly sensitivity: number,
        public readonly actionType: number,
        public readonly banDurationSeconds: number,
        public readonly guardEnabled: boolean,
        public readonly guardDurationSeconds: number,
        public readonly guardSensitivity: number,
        public readonly incidentActive: boolean,
        public readonly lastRaidAtEpochSeconds: number
    )
    {}
}
