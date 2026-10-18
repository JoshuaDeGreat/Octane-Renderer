import { IMessageDataWrapper } from '@octane/api';

/** One WIRED Link network as the Link window lists it (AIR WiredLinkNetwork). The id "0" means no network. */
export interface IWiredLinkNetwork
{
    id: string;
    name: string;
    connectionCount: number;
    linkedInCurrentRoom: boolean;
}

/** One connected Link of a network, possibly in another room (AIR WiredLinkConnection). */
export interface IWiredLinkConnection
{
    roomId: number;
    roomName: string;
    furniId: number;
    isBuildersClub: boolean;
    receiveLocal: boolean;
}

export const WIRED_LINK_NO_NETWORK = '0';

/** The most networks a packet may list; a longer list is not trusted. */
export const WIRED_LINK_MAX_LIST = 1000;

export const readWiredLinkNetwork = (wrapper: IMessageDataWrapper): IWiredLinkNetwork =>
{
    const id = wrapper.readString();
    const name = wrapper.readString();
    const connectionCount = wrapper.readInt();
    const linkedInCurrentRoom = wrapper.readBoolean();

    return { id, name, connectionCount, linkedInCurrentRoom };
};

export const readWiredLinkNetworks = (wrapper: IMessageDataWrapper): IWiredLinkNetwork[] =>
{
    const count = wrapper.readInt();
    const networks: IWiredLinkNetwork[] = [];

    if(count < 0 || count > WIRED_LINK_MAX_LIST) return networks;

    for(let i = 0; i < count; i++) networks.push(readWiredLinkNetwork(wrapper));

    return networks;
};

export const readWiredLinkConnection = (wrapper: IMessageDataWrapper): IWiredLinkConnection =>
{
    const roomId = wrapper.readInt();
    const roomName = wrapper.readString();
    const furniId = wrapper.readInt();
    const isBuildersClub = wrapper.readBoolean();
    const receiveLocal = wrapper.readBoolean();

    return { roomId, roomName, furniId, isBuildersClub, receiveLocal };
};
