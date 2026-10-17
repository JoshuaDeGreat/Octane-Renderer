import { IVector3D } from '../../../utils';
import { IRoomGeometry } from '../../IRoomGeometry';
import { IPlaneDrawingData } from './IPlaneDrawingData';

export interface IRoomPlane
{
    uniqueId: number;
    type: number;
    location: IVector3D;
    leftSide: IVector3D;
    rightSide: IVector3D;
    color: number;
    // The plane as the AIR camera scene sends it to the server (RoomPlane.getDrawingDatas).
    getDrawingDatas(geometry: IRoomGeometry): IPlaneDrawingData[];
}
