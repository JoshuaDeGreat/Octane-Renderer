import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export interface IRecolorFurniUpdate
{
    furniIds: number[];
    red: number;
    green: number;
    blue: number;
}

/** Official recolour update (181): groups of furni ids that now have the given colour. */
export class RecolorFurniUpdateParser implements IMessageParser
{
    private _updates: IRecolorFurniUpdate[];

    public flush(): boolean
    {
        this._updates = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        let count = wrapper.readInt();

        while(count > 0)
        {
            const furniIds: number[] = [];
            let idCount = wrapper.readInt();

            while(idCount > 0)
            {
                furniIds.push(wrapper.readInt());

                idCount--;
            }

            const red = wrapper.readShort();
            const green = wrapper.readShort();
            const blue = wrapper.readShort();

            this._updates.push({ furniIds, red, green, blue });

            count--;
        }

        return true;
    }

    public get updates(): IRecolorFurniUpdate[]
    {
        return this._updates;
    }
}
