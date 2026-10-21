import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoomEngineObjectPlaySoundEvent } from '@octane/events';
import { clampPlaybackRate, FURNITURE_SOUND_CUCKOO_CLOCK, getRoomObjectSoundUrl } from '../RoomObjectSounds';
import { SoundManager } from '../SoundManager';

vi.mock('../music/MusicController', () => ({
    MusicController: class
    {
        public init()
        {}
        public updateVolume()
        {}
    }
}));

class FakeAudio
{
    public static created: FakeAudio[] = [];

    public volume = 1;
    public currentTime = 0;
    public playbackRate = 1;
    public defaultPlaybackRate = 1;
    public preservesPitch = true;
    public play = vi.fn(() => Promise.resolve());
    public pause = vi.fn();

    constructor(public src: string)
    {
        FakeAudio.created.push(this);
    }
}

const playSound = (manager: SoundManager, type: string, soundId: string, pitch = 1) =>
    (manager as any).onEvent(new RoomEngineObjectPlaySoundEvent(type, 1, 5, 10, soundId, pitch));

describe('room object sounds (official HabboSoundManagerFlash10)', () =>
{
    beforeEach(() =>
    {
        FakeAudio.created = [];
        vi.stubGlobal('Audio', FakeAudio);
    });

    afterEach(() =>
    {
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    it('bundles the cuckoo clock sample and knows no other id', () =>
    {
        expect(getRoomObjectSoundUrl(FURNITURE_SOUND_CUCKOO_CLOCK)).toBeTruthy();
        expect(getRoomObjectSoundUrl('HBST_unknown')).toBeNull();
        expect(getRoomObjectSoundUrl(null)).toBeNull();
    });

    it('clamps the pitch to a playback rate the browser accepts', () =>
    {
        expect(clampPlaybackRate(2)).toBe(2);
        expect(clampPlaybackRate(Math.pow(2, -1.2))).toBeCloseTo(0.435, 3);
        expect(clampPlaybackRate(0)).toBe(1);
        expect(clampPlaybackRate(Number.NaN)).toBe(1);
        expect(clampPlaybackRate(100)).toBe(16);
    });

    it('plays the cuckoo clock at its pitch, one sound per call, at the system volume', () =>
    {
        const manager = new SoundManager();

        playSound(manager, RoomEngineObjectPlaySoundEvent.PLAY_SOUND_AT_PITCH, FURNITURE_SOUND_CUCKOO_CLOCK, 2);
        playSound(manager, RoomEngineObjectPlaySoundEvent.PLAY_SOUND_AT_PITCH, FURNITURE_SOUND_CUCKOO_CLOCK, 0.5);

        expect(FakeAudio.created).toHaveLength(2);
        expect(FakeAudio.created[0].playbackRate).toBe(2);
        expect(FakeAudio.created[0].preservesPitch).toBe(false);
        expect(FakeAudio.created[1].playbackRate).toBe(0.5);
        expect(FakeAudio.created[0].volume).toBe(manager.systemVolume);
        expect(FakeAudio.created[0].play).toHaveBeenCalledOnce();
    });

    it('drops a plain repeat of the same sound within 200 ms', () =>
    {
        vi.useFakeTimers();
        vi.setSystemTime(1000);

        const manager = new SoundManager();

        playSound(manager, RoomEngineObjectPlaySoundEvent.PLAY_SOUND, FURNITURE_SOUND_CUCKOO_CLOCK);
        vi.setSystemTime(1150);
        playSound(manager, RoomEngineObjectPlaySoundEvent.PLAY_SOUND, FURNITURE_SOUND_CUCKOO_CLOCK);

        expect(FakeAudio.created).toHaveLength(1);
        expect(FakeAudio.created[0].play).toHaveBeenCalledTimes(1);

        vi.setSystemTime(1300);
        playSound(manager, RoomEngineObjectPlaySoundEvent.PLAY_SOUND, FURNITURE_SOUND_CUCKOO_CLOCK);

        expect(FakeAudio.created).toHaveLength(1);
        expect(FakeAudio.created[0].play).toHaveBeenCalledTimes(2);
    });

    it('ignores ids the official sound manager has no asset for', () =>
    {
        const manager = new SoundManager();

        playSound(manager, RoomEngineObjectPlaySoundEvent.PLAY_SOUND_AT_PITCH, 'FURNITURE_unknown', 1);

        expect(FakeAudio.created).toHaveLength(0);
    });
});
