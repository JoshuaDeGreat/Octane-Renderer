import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/**
 * One object's variable values (AIR `?_-f1S?/WiredObjectInspectionData`): type (0 furni, 1 user, -10 room), the
 * furni's item id or the user's room index (absent for the room), `count × (variable id, value)`, and for a furni
 * `count × id` of the wired boxes that pick it.
 */
export class WiredVariablesForObjectParser implements IMessageParser
{
    public static readonly TYPE_FURNI = 0;
    public static readonly TYPE_USER = 1;
    public static readonly TYPE_ROOM = -10;

    private _type = 0;
    private _objectId = 0;
    private _userIndex = 0;
    private _values: Map<string, number> = new Map();
    private _configuredInWireds: number[] = [];

    public flush(): boolean
    {
        this._type = 0;
        this._objectId = 0;
        this._userIndex = 0;
        this._values = new Map();
        this._configuredInWireds = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._type = wrapper.readInt();

        if(this._type === WiredVariablesForObjectParser.TYPE_FURNI) this._objectId = wrapper.readInt();
        else if(this._type === WiredVariablesForObjectParser.TYPE_USER) this._userIndex = wrapper.readInt();

        let count = wrapper.readInt();

        while(count > 0)
        {
            const id = wrapper.readString();

            this._values.set(id, wrapper.readInt());

            count--;
        }

        if(this._type === WiredVariablesForObjectParser.TYPE_FURNI)
        {
            let boxes = wrapper.readInt();

            while(boxes > 0)
            {
                this._configuredInWireds.push(wrapper.readInt());

                boxes--;
            }
        }

        return true;
    }

    public get type(): number
    {
        return this._type;
    }

    /** The furni's item id (type 0). */
    public get objectId(): number
    {
        return this._objectId;
    }

    /** The user's room index (type 1). */
    public get userIndex(): number
    {
        return this._userIndex;
    }

    public get values(): ReadonlyMap<string, number>
    {
        return this._values;
    }

    /** Ids of the wired boxes that pick the furni (type 0). */
    public get configuredInWireds(): readonly number[]
    {
        return this._configuredInWireds;
    }
}
