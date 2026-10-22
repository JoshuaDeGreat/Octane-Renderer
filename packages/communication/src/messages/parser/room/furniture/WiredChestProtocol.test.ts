import { BinaryReader, BinaryWriter } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { EvaWireDataWrapper } from '../../../../codec/evawire/EvaWireDataWrapper';
import { EvaWireFormat } from '../../../../codec/evawire/EvaWireFormat';
import { OctaneMessages } from '../../../../OctaneMessages';
import { IncomingHeader } from '../../../incoming/IncomingHeader';
import { ChestCoinsEvent, ChestFurniChunkEvent, ChestFurniDeltaEvent, ChestOpenEvent, ChestSettingsUpdatedEvent, ChestUpgradeResultEvent, WiredTradeCancelledEvent, WiredTradeCompletedEvent, WiredTradeErrorEvent, WiredTradeItemsEvent, WiredTradeOpenEvent, WiredTransactionFailEvent, WiredTransactionSuccessEvent } from '../../../incoming/room/furniture';
import { OutgoingHeader } from '../../../outgoing/OutgoingHeader';
import { ChestCloseComposer, ChestOpenComposer, ChestSaveNotificationsComposer, ChestSaveOptionsComposer, ChestSaveSettingsComposer, ChestStartDepositComposer, ChestUpgradeCapacityComposer, ChestWithdrawAllComposer, ChestWithdrawCoinsComposer, ChestWithdrawFurniComposer, ChestDepositComposer, ChestWithdrawComposer, ChestDepositInventoryItemComposer, ChestEnableWiredComposer, ChestWithdrawAllFurniComposer, WiredChestLockComposer, WiredTradeAcceptComposer, WiredTradeCancelComposer, WiredTradeOfferItemsComposer } from '../../../outgoing/room/furniture/chest';
import { ChestCoinsMessageParser } from './ChestCoinsMessageParser';
import { ChestFurniChunkMessageParser } from './ChestFurniChunkMessageParser';
import { ChestFurniDeltaMessageParser } from './ChestFurniDeltaMessageParser';
import { ChestOpenMessageParser } from './ChestOpenMessageParser';
import { ChestSettingsUpdatedMessageParser } from './ChestSettingsUpdatedMessageParser';
import { ChestUpgradeResultMessageParser } from './ChestUpgradeResultMessageParser';
import { WiredTradeErrorMessageParser } from './WiredTradeErrorMessageParser';
import { WiredTradeItemsMessageParser } from './WiredTradeItemsMessageParser';
import { WiredTradeOpenMessageParser } from './WiredTradeOpenMessageParser';
import { WiredTransactionFailMessageParser } from './WiredTransactionFailMessageParser';
import { WIRED_TRANSACTION_SUCCESS_DEPOSIT, WIRED_TRANSACTION_SUCCESS_REWARD, WiredTransactionSuccessMessageParser } from './WiredTransactionSuccessMessageParser';

// Field orders: the AIR WIN63-202610131318 chest, trade and transaction classes (map in PlusEMU
// reviews/chest-protocol-map.md, ported from volt-renderer, GPL-3.0). The ids are ours, never the official
// rotated table.

const hex = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('');
/** The frame body a composer produces (length + header stripped). */
const body = (header: number, values: unknown[]) => hex(new EvaWireFormat().encode(header, values).getBuffer().slice(6));
const wrap = (writer: BinaryWriter) => new EvaWireDataWrapper(0, new BinaryReader(writer.getBuffer() ?? new ArrayBuffer(0)));
const int = (value: number) => (value >>> 0).toString(16).padStart(8, '0');
const bool = (value: boolean) => (value ? '01' : '00');
const str = (value: string) => (new TextEncoder().encode(value).length).toString(16).padStart(4, '0') + hex(new TextEncoder().encode(value).buffer);

/** A ChestStorage row (AIR package_198/ChestStorage) with legacy stuff data. */
const writeStorage = (writer: BinaryWriter, id: number, wall: boolean, typeId: number) =>
{
    writer.writeInt(id);
    writer.writeInt(0);
    writer.writeInt(0);
    writer.writeInt(77);
    writer.writeByte(wall ? 1 : 0);
    writer.writeInt(typeId);
    writer.writeString(wall ? '9' : '');
    writer.writeByte(1);
    writer.writeInt(1);
    writer.writeInt(0);
    writer.writeString('state');
    if(!wall) writer.writeInt(5);
};

/** A trade item (AIR package_141/class_2591, the normal trading item layout). */
const writeTradeItem = (writer: BinaryWriter, itemId: number, type: 'I' | 'S', typeId: number) =>
{
    writer.writeInt(itemId);
    writer.writeString(type);
    writer.writeInt(itemId + 1000);
    writer.writeInt(typeId);
    writer.writeInt(1);
    writer.writeByte(1);
    writer.writeInt(0);
    writer.writeString('');
    writer.writeInt(15);
    writer.writeInt(10);
    writer.writeInt(2026);
    if(type === 'S') writer.writeInt(0);
};

/** int n, TradeRequirementNode[n]: byte type, int amount, if furni: bool wall, int typeId, string posterId. */
const writeRule = (writer: BinaryWriter) =>
{
    writer.writeInt(2);
    writer.writeByte(0);
    writer.writeInt(50);
    writer.writeByte(1);
    writer.writeInt(3);
    writer.writeByte(0);
    writer.writeInt(202);
    writer.writeString('');
};

describe('wired chest AIR protocol', () =>
{
    it('registers every chest and trade message on our header ids', () =>
    {
        const messages = new OctaneMessages();
        const outgoing: [number, unknown][] = [
            [OutgoingHeader.CHEST_OPEN, ChestOpenComposer], [OutgoingHeader.CHEST_CLOSE, ChestCloseComposer],
            [OutgoingHeader.CHEST_START_DEPOSIT, ChestStartDepositComposer], [OutgoingHeader.CHEST_WITHDRAW_ALL_FURNI, ChestWithdrawAllFurniComposer],
            [OutgoingHeader.CHEST_DEPOSIT, ChestDepositComposer], [OutgoingHeader.CHEST_DEPOSIT_INVENTORY_ITEM, ChestDepositInventoryItemComposer], [OutgoingHeader.CHEST_ENABLE_WIRED, ChestEnableWiredComposer],
            [OutgoingHeader.CHEST_WITHDRAW_FURNI, ChestWithdrawFurniComposer], [OutgoingHeader.CHEST_WITHDRAW, ChestWithdrawComposer],
            [OutgoingHeader.CHEST_SAVE_SETTINGS, ChestSaveSettingsComposer], [OutgoingHeader.CHEST_SAVE_OPTIONS, ChestSaveOptionsComposer],
            [OutgoingHeader.CHEST_SAVE_NOTIFICATIONS, ChestSaveNotificationsComposer], [OutgoingHeader.CHEST_UPGRADE_CAPACITY, ChestUpgradeCapacityComposer],
            [OutgoingHeader.WIRED_CHEST_LOCK, WiredChestLockComposer], [OutgoingHeader.WIRED_TRADE_OFFER_ITEMS, WiredTradeOfferItemsComposer],
            [OutgoingHeader.WIRED_TRADE_ACCEPT, WiredTradeAcceptComposer], [OutgoingHeader.WIRED_TRADE_CANCEL, WiredTradeCancelComposer]
        ];
        const incoming: [number, unknown][] = [
            [IncomingHeader.CHEST_OPEN, ChestOpenEvent], [IncomingHeader.CHEST_SETTINGS_UPDATED, ChestSettingsUpdatedEvent],
            [IncomingHeader.CHEST_UPGRADE_RESULT, ChestUpgradeResultEvent], [IncomingHeader.CHEST_COINS, ChestCoinsEvent],
            [IncomingHeader.CHEST_FURNI_CHUNK, ChestFurniChunkEvent], [IncomingHeader.CHEST_FURNI_DELTA, ChestFurniDeltaEvent],
            [IncomingHeader.WIRED_TRANSACTION_FAIL, WiredTransactionFailEvent], [IncomingHeader.WIRED_TRANSACTION_SUCCESS, WiredTransactionSuccessEvent],
            [IncomingHeader.WIRED_TRADE_ERROR, WiredTradeErrorEvent], [IncomingHeader.WIRED_TRADE_OPEN, WiredTradeOpenEvent],
            [IncomingHeader.WIRED_TRADE_ITEMS, WiredTradeItemsEvent], [IncomingHeader.WIRED_TRADE_CANCELLED, WiredTradeCancelledEvent],
            [IncomingHeader.WIRED_TRADE_COMPLETED, WiredTradeCompletedEvent]
        ];

        for(const [header, composer] of outgoing) expect(messages.composers.get(header), `outgoing ${ header }`).toBe(composer);
        for(const [header, event] of incoming) expect(messages.events.get(header), `incoming ${ header }`).toBe(event);

        // Within one direction an id may only name one message.
        const count = (registry: object, header: number) => Object.values(registry).filter(value => value === header).length;
        for(const [header] of outgoing) expect(count(OutgoingHeader, header), `OutgoingHeader ${ header }`).toBe(1);
        for(const [header] of incoming) expect(count(IncomingHeader, header), `IncomingHeader ${ header }`).toBe(1);

        // Heaven Polaris intentionally restores direct chest deposit and enable-wired packets.
        for(const header of [9313, 9325, 9345])
            expect(Object.values(OutgoingHeader).includes(header), `OutgoingHeader ${ header }`).toBe(true);
    });

    it('serialises the chest composers in AIR field order', () =>
    {
        expect(body(1595, new ChestOpenComposer(7).getMessageArray())).toBe(int(7));
        expect(body(1154, new ChestCloseComposer(7).getMessageArray())).toBe(int(7));
        expect(body(3268, new ChestStartDepositComposer(7).getMessageArray())).toBe(int(7));
        expect(body(57, new ChestWithdrawAllComposer(7).getMessageArray())).toBe(int(7));
        expect(body(715, new ChestWithdrawFurniComposer(7, true, 4001, '12', 3).getMessageArray()))
            .toBe(int(7) + bool(true) + int(4001) + str('12') + int(3));
        expect(body(3731, new ChestWithdrawCoinsComposer(7, 250).getMessageArray())).toBe(int(7) + int(250));
        expect(body(3274, new ChestSaveSettingsComposer(7, 'Box', 'Desc', true, false, 2, 5, 3).getMessageArray()))
            .toBe(int(7) + str('Box') + str('Desc') + bool(true) + bool(false) + int(2) + int(5) + int(3));
        expect(body(1211, new ChestSaveOptionsComposer(7, true, false, 900).getMessageArray()))
            .toBe(int(7) + bool(true) + bool(false) + int(900));
        expect(body(3937, new ChestSaveNotificationsComposer(7, true, false, true, false, true, 2).getMessageArray()))
            .toBe(int(7) + bool(true) + bool(false) + bool(true) + bool(false) + bool(true) + int(2));
        expect(body(2964, new ChestUpgradeCapacityComposer(7, 2).getMessageArray())).toBe(int(7) + int(2));
    });

    it('serialises the lock and wired trade composers in AIR field order', () =>
    {
        expect(body(1323, new WiredChestLockComposer(true, false).getMessageArray())).toBe(bool(true) + bool(false));
        expect(body(1774, new WiredTradeOfferItemsComposer(false, 11, 12).getMessageArray())).toBe(bool(false) + int(2) + int(11) + int(12));
        expect(body(609, new WiredTradeAcceptComposer(false).getMessageArray())).toBe(bool(false));
        expect(body(609, new WiredTradeAcceptComposer(true).getMessageArray())).toBe(bool(true));
        expect(body(1898, new WiredTradeCancelComposer().getMessageArray())).toBe('');
    });

    it('reads the chest open, settings, upgrade and coin messages', () =>
    {
        const open = new ChestOpenMessageParser();
        expect(open.parse(wrap(new BinaryWriter().writeInt(7) as BinaryWriter))).toBe(true);
        expect(open.chestId).toBe(7);

        const settings = new ChestSettingsUpdatedMessageParser();
        expect(settings.parse(wrap(new BinaryWriter().writeInt(7).writeByte(1) as BinaryWriter))).toBe(true);
        expect([settings.chestId, settings.isNotificationPreferences]).toEqual([7, true]);

        const upgrade = new ChestUpgradeResultMessageParser();
        expect(upgrade.parse(wrap(new BinaryWriter().writeInt(7).writeInt(0) as BinaryWriter))).toBe(true);
        expect([upgrade.chestId, upgrade.resultCode, upgrade.successful]).toEqual([7, 0, true]);

        const coins = new ChestCoinsMessageParser();
        const coinsWrapper = wrap(new BinaryWriter().writeInt(7).writeInt(1234).writeByte(0) as BinaryWriter);
        expect(coins.parse(coinsWrapper)).toBe(true);
        expect(coinsWrapper.bytesAvailable).toBe(false);
        expect([coins.chestId, coins.coins, coins.isUpdate]).toEqual([7, 1234, false]);
    });

    it('reads furni chest fragments and updates with ChestStorage rows', () =>
    {
        const chunk = new BinaryWriter();
        chunk.writeInt(7).writeInt(2).writeInt(0).writeInt(2);
        writeStorage(chunk, 101, false, 4001);
        writeStorage(chunk, 102, true, 4002);
        const chunkWrapper = wrap(chunk);
        const chunkParser = new ChestFurniChunkMessageParser();
        expect(chunkParser.parse(chunkWrapper)).toBe(true);
        expect(chunkWrapper.bytesAvailable).toBe(false);
        expect([chunkParser.chestId, chunkParser.totalFragments, chunkParser.fragmentNo]).toEqual([7, 2, 0]);
        expect(chunkParser.items.map(item => [item.inventoryId, item.transactionId, item.wallItem, item.baseItemId, item.legacyPosterId, item.extra]))
            .toEqual([[101, 77, false, 4001, '', 5], [102, 77, true, 4002, '9', 0]]);

        const update = new BinaryWriter();
        update.writeInt(7).writeInt(2).writeInt(101).writeInt(102).writeInt(1);
        writeStorage(update, 103, false, 4003);
        const updateWrapper = wrap(update);
        const updateParser = new ChestFurniDeltaMessageParser();
        expect(updateParser.parse(updateWrapper)).toBe(true);
        expect(updateWrapper.bytesAvailable).toBe(false);
        expect(updateParser.removedIds).toEqual([101, 102]);
        expect(updateParser.added.map(item => item.inventoryId)).toEqual([103]);
    });

    it('reads transaction fail, trade error and success with and without reward contents', () =>
    {
        const fail = new WiredTransactionFailMessageParser();
        expect(fail.parse(wrap(new BinaryWriter().writeInt(4) as BinaryWriter))).toBe(true);
        expect(fail.failureReason).toBe(4);

        const error = new WiredTradeErrorMessageParser();
        expect(error.parse(wrap(new BinaryWriter().writeInt(3) as BinaryWriter))).toBe(true);
        expect(error.tradeErrorId).toBe(3);

        const success = new WiredTransactionSuccessMessageParser();
        expect(success.parse(wrap(new BinaryWriter().writeInt(WIRED_TRANSACTION_SUCCESS_DEPOSIT) as BinaryWriter))).toBe(true);
        expect([success.successType, success.hasRewardContents]).toEqual([0, false]);

        // A reward without contents is legal: nothing follows the type.
        expect(success.parse(wrap(new BinaryWriter().writeInt(WIRED_TRANSACTION_SUCCESS_REWARD) as BinaryWriter))).toBe(true);
        expect([success.successType, success.hasRewardContents]).toEqual([2, false]);

        const reward = new BinaryWriter();
        reward.writeInt(WIRED_TRANSACTION_SUCCESS_REWARD);
        writeRule(reward);
        reward.writeString('Well done');
        reward.writeByte(1);
        const rewardWrapper = wrap(reward);
        expect(success.parse(rewardWrapper)).toBe(true);
        expect(rewardWrapper.bytesAvailable).toBe(false);
        expect(success.rewardRule).toEqual({ nodes: [
            { type: 0, amount: 50, itemType: null },
            { type: 1, amount: 3, itemType: { isWallItem: false, typeId: 202, legacyPosterId: '' } }
        ] });
        expect([success.rewardText, success.openByDefault, success.hasRewardContents]).toEqual(['Well done', true, true]);
    });

    it('reads Heaven Polaris trade opening in the correct field order', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(1).writeString('Rare chair').writeString('generic');
        writer.writeByte(1).writeByte(0).writeInt(60);
        writer.writeInt(1); // one give alternative
        writer.writeInt(2); // two nodes
        writer.writeInt(0).writeInt(-1).writeByte(0).writeInt(0).writeInt(50);
        writer.writeInt(1).writeInt(0).writeByte(0).writeInt(401).writeInt(2);
        writer.writeByte(1); // reward rule present
        writer.writeInt(1).writeInt(1).writeInt(0).writeByte(1).writeInt(402).writeInt(1);

        const data = wrap(writer);
        const parser = new WiredTradeOpenMessageParser();
        expect(parser.parse(data)).toBe(true);
        expect(data.bytesAvailable).toBe(false);
        expect([parser.contractType, parser.rewardText, parser.layoutType, parser.timeoutSeconds])
            .toEqual([1, 'Rare chair', 'generic', 60]);
        expect(parser.showRequirementsImmediate).toBe(true);
        expect(parser.giveRules[0].nodes).toEqual([
            { kind: 0, currencyType: -1, wallItem: false, spriteId: 0, amount: 50 },
            { kind: 1, currencyType: 0, wallItem: false, spriteId: 401, amount: 2 }
        ]);
        expect(parser.rewardRule.nodes[0].spriteId).toBe(402);
    });

    it('rejects impossible Heaven wired trade counts', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(0).writeString('').writeString('').writeByte(0).writeByte(0).writeInt(30);
        writer.writeInt(0x7fffffff);
        expect(new WiredTradeOpenMessageParser().parse(wrap(writer))).toBe(false);
    });

    it('reads Polaris trade table with offered furniture, rewards and missing requirements', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(1).writeByte(1).writeInt(25);
        writer.writeInt(2);
        writer.writeInt(11).writeByte(0).writeInt(4001);
        writer.writeInt(12).writeByte(1).writeInt(4002);
        writer.writeInt(1).writeInt(4003).writeInt(2);
        writer.writeInt(1).writeInt(-1).writeInt(25);
        writer.writeInt(1).writeInt(1).writeInt(0).writeByte(0).writeInt(4004).writeInt(1);
        const data = wrap(writer);
        const parser = new WiredTradeItemsMessageParser();
        expect(parser.parse(data)).toBe(true);
        expect(data.bytesAvailable).toBe(false);
        expect([parser.state, parser.canAccept, parser.secondsLeft]).toEqual([1, true, 25]);
        expect(parser.offeredItems).toEqual([
            { itemId: 11, wallItem: false, spriteId: 4001 },
            { itemId: 12, wallItem: true, spriteId: 4002 }
        ]);
        expect(parser.rewardFurni).toEqual([{ spriteId: 4003, amount: 2 }]);
        expect(parser.rewardCurrency).toEqual([{ currencyType: -1, amount: 25 }]);
        expect(parser.missing[0]).toEqual({ kind: 1, currencyType: 0, wallItem: false, spriteId: 4004, amount: 1 });
    });

    it('serialises Polaris-only chest commands', () =>
    {
        expect(body(9313, new ChestDepositComposer(7, -1, 50).getMessageArray())).toBe(int(7) + int(-1) + int(50));
        expect(body(9314, new ChestWithdrawComposer(7, -1, -1).getMessageArray())).toBe(int(7) + int(-1) + int(-1));
        expect(body(9325, new ChestDepositInventoryItemComposer(7, 99).getMessageArray())).toBe(int(7) + int(99));
        expect(body(9345, new ChestEnableWiredComposer(7).getMessageArray())).toBe(int(7));
        expect(body(9326, new ChestWithdrawAllFurniComposer(7).getMessageArray())).toBe(int(7));
    });
});
