import { GetRoomEngine, RoomEngine } from '@octane/room';
export { };

declare global
{
	interface Window
	{
		OctaneDevTools?:
		{
            roomEngine: RoomEngine;
            setPlaneRenderMode: (mode: 'bake' | 'direct') => void;
		};
	}
}

window.OctaneDevTools = {
    roomEngine: GetRoomEngine(),
    setPlaneRenderMode: mode => GetRoomEngine().setPlaneRenderMode(mode === 'direct')
};
