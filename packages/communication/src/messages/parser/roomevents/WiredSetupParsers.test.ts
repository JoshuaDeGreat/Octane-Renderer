import { describe, expect, it } from 'vitest';
import { IMessageDataWrapper } from '@octane/api';
import { WiredSetupExportComposer, WiredSetupImportComposer } from '../../outgoing';
import { WiredSetupExportResultParser } from './WiredSetupExportResultParser';
import { WiredSetupImportResultParser } from './WiredSetupImportResultParser';

const wrapper = (values: Array<number | string>): IMessageDataWrapper =>
{
    const queue = [ ...values ];

    return {
        readInt: () => queue.shift() as number,
        readString: () => queue.shift() as string
    } as unknown as IMessageDataWrapper;
};

describe('wired setup share packets', () =>
{
    it('sends the export version and the import fields in contract order', () =>
    {
        expect(new WiredSetupExportComposer().getMessageArray()).toEqual([ 1 ]);
        expect(new WiredSetupImportComposer('OWS1:abc', 1, true, false).getMessageArray()).toEqual([ 'OWS1:abc', 1, true, false ]);
    });

    it('reads the share code result', () =>
    {
        const parser = new WiredSetupExportResultParser();

        expect(parser.parse(wrapper([ 0, 12, 'OWS1:xyz' ]))).toBe(true);
        expect(parser.status).toBe(0);
        expect(parser.boxCount).toBe(12);
        expect(parser.code).toBe('OWS1:xyz');
    });

    it('reads the import report and ignores malformed fields', () =>
    {
        const parser = new WiredSetupImportResultParser();
        const json = JSON.stringify({
            confirmed: false,
            status: 0,
            anchorX: 3,
            anchorY: 4,
            total: 2,
            configured: 1,
            placed: 0,
            missing: 1,
            refused: 0,
            entries: [
                { index: 0, type: 'wf_trg_says_something', holder: 'TRIGGER', x: 3, y: 4, status: 1, itemId: 77, reason: '' },
                { index: 'x', type: 5, status: 3 },
                null
            ]
        });

        expect(parser.parse(wrapper([ json ]))).toBe(true);
        expect(parser.report?.anchorX).toBe(3);
        expect(parser.report?.entries).toHaveLength(2);
        expect(parser.report?.entries[0].itemId).toBe(77);
        expect(parser.report?.entries[1]).toMatchObject({ index: 0, type: '', status: 3 });
    });

    it('refuses a report that is not JSON', () =>
    {
        const parser = new WiredSetupImportResultParser();

        expect(parser.parse(wrapper([ 'not json' ]))).toBe(false);
        expect(parser.report).toBeNull();
    });
});
