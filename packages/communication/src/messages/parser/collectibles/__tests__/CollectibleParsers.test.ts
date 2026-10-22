import { BinaryReader } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { EvaWireDataWrapper } from '../../../../codec/evawire/EvaWireDataWrapper';
import { ClaimCollectibleRewardsComposer, GetSelectedNftWardrobeOutfitComposer, GetUserNftWardrobeComposer, OpenCollectibleRewardBoxComposer, PurchaseCollectibleComposer, SaveUserNftWardrobeComposer, TransferCollectiblesComposer } from '../../../outgoing';
import { CollectibleCollectionsParser } from '../CollectibleCollectionsParser';
import { CollectiblesInventoryUpdateParser } from '../CollectiblesInventoryUpdateParser';
import { CollectibleShopOffersParser } from '../CollectibleShopOffersParser';
import { CollectibleWalletsParser } from '../CollectibleWalletsParser';
import { CollectibleItemClaimData } from '../CollectibleCollectionData';
import { SelectedNftWardrobeOutfitParser } from '../SelectedNftWardrobeOutfitParser';
import { UserNftWardrobeParser } from '../UserNftWardrobeParser';

class PacketWriter
{
    private readonly _bytes: number[] = [];

    public int(value: number): this
    {
        this._bytes.push((value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff);

        return this;
    }

    public short(value: number): this
    {
        this._bytes.push((value >>> 8) & 0xff, value & 0xff);

        return this;
    }

    public bool(value: boolean): this
    {
        this._bytes.push(value ? 1 : 0);

        return this;
    }

    public long(value: number): this
    {
        return this.int(Math.floor(value / 0x100000000)).int(value >>> 0);
    }

    public string(value: string): this
    {
        const encoded = new TextEncoder().encode(value);

        this._bytes.push((encoded.length >>> 8) & 0xff, encoded.length & 0xff, ...encoded);

        return this;
    }

    public product(code: string, amount: number | null = null): this
    {
        this.short(1).string('18').int(120);

        if(amount !== null) this.int(amount);

        return this.string('').int(2).int(3001).int(3002).string(code).string('epic');
    }

    public wrapper(): EvaWireDataWrapper
    {
        return new EvaWireDataWrapper(0, new BinaryReader(Uint8Array.from(this._bytes).buffer));
    }
}

describe('collectibles parsers', () =>
{
    it('reads the collector wallet first, then the linked wallets', () =>
    {
        const parser = new CollectibleWalletsParser();

        parser.flush();
        parser.parse(new PacketWriter().string('hotel-7').int(1).string('0xabc').wrapper());

        expect(parser.collectorWallet).toBe('hotel-7');
        expect(parser.wallets).toEqual([ 'hotel-7', '0xabc' ]);
    });

    it('reads a set with its reward claim (class_4341)', () =>
    {
        const parser = new CollectibleCollectionsParser();
        const packet = new PacketWriter()
            .int(1)
            .int(1).product('nft_bear', 2)
            .string('toys').string('Toys').int(120).int(150).int(300)
            .bool(false)
            .bool(true).product('nft_trophy', 0)
            .long(-1).long(-1)
            .short(1)
            .string('reward:toys').int(0).int(1).short(0);

        parser.flush();
        expect(parser.parse(packet.wrapper())).toBe(true);

        const set = parser.collections[0];

        expect(set.items[0].productCode).toBe('nft_bear');
        expect(set.items[0].amount).toBe(2);
        expect(set.items[0].figureSetIds).toEqual([ 3001, 3002 ]);
        expect([ set.collectionId, set.collectionName, set.score, set.goal, set.completionXp ]).toEqual([ 'toys', 'Toys', 120, 150, 300 ]);
        expect(set.bonusItem).toBeNull();
        expect(set.rewardItem.productCode).toBe('nft_trophy');
        expect([ set.bonusStart, set.bonusEnd ]).toEqual([ -1, -1 ]);
        expect(set.rewardClaim.status).toBe(CollectibleItemClaimData.STATUS_AVAILABLE);
        expect(set.progressPercentage).toBe(100);
    });

    it('reads shop offers and whether they can still be bought', () =>
    {
        const parser = new CollectibleShopOffersParser();

        parser.flush();
        parser.parse(new PacketWriter().int(1).string('nft_bear').int(50).bool(false).bool(false).int(10).int(10).product('nft_bear').wrapper());

        expect(parser.offers[0].emeraldPrice).toBe(50);
        expect(parser.offers[0].canBuy).toBe(false);
    });

    it('reads long asset ids of added and removed collectibles', () =>
    {
        const parser = new CollectiblesInventoryUpdateParser();

        parser.flush();
        parser.parse(new PacketWriter().int(1).long(5_000_000_000).product('nft_bear').int(1).long(9).product('nft_duck').wrapper());

        expect(parser.added[0].assetId).toBe(5_000_000_000);
        expect(parser.removed[0].product.productCode).toBe('nft_duck');
    });

    it('composers carry the official fields', () =>
    {
        expect(new PurchaseCollectibleComposer('nft_bear', 'hotel-7').getMessageArray()).toEqual([ 'nft_bear', 'hotel-7' ]);
        expect(new TransferCollectiblesComposer('Bob').getMessageArray()).toEqual([ 'Bob' ]);
        expect(new ClaimCollectibleRewardsComposer('', '').getMessageArray()).toEqual([ '', '' ]);
        expect(new OpenCollectibleRewardBoxComposer(42).getMessageArray()).toEqual([ 42 ]);
    });

    it('reads the avatar editor NFT wardrobe items (NftWardrobeItem) and replaces the list', () =>
    {
        const parser = new UserNftWardrobeParser();

        parser.flush();
        parser.parse(new PacketWriter().int(2)
            .string('41').string('hd-180-1.hr-100-61').string('M').string('41').string('habbo:avatar')
            .string('42').string('hd-600-1').string('F').string('42').string('habbo:avatar_genesis')
            .wrapper());

        expect(parser.nftAvatars.map(item => [ item.id, item.figureString, item.gender, item.tokenId, item.contractKey ])).toEqual([
            [ '41', 'hd-180-1.hr-100-61', 'M', '41', 'habbo:avatar' ],
            [ '42', 'hd-600-1', 'F', '42', 'habbo:avatar_genesis' ]
        ]);

        parser.flush();
        parser.parse(new PacketWriter().int(0).wrapper());

        expect(parser.nftAvatars).toEqual([]);
    });

    it('reads the worn avatar collectible and the look it replaced (class_4190)', () =>
    {
        const parser = new SelectedNftWardrobeOutfitParser();

        parser.flush();
        parser.parse(new PacketWriter().string('41').string('hd-190-1').string('M').wrapper());

        expect([ parser.tokenId, parser.fallbackFigure, parser.fallbackGender ]).toEqual([ '41', 'hd-190-1', 'M' ]);
    });

    it('avatar collectible composers carry the official fields', () =>
    {
        expect(new GetUserNftWardrobeComposer().getMessageArray()).toEqual([]);
        expect(new GetSelectedNftWardrobeOutfitComposer().getMessageArray()).toEqual([]);
        expect(new SaveUserNftWardrobeComposer('41').getMessageArray()).toEqual([ '41' ]);
    });
});
