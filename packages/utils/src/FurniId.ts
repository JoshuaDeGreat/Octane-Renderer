export class FurniId
{
    private static BUILDER_CLUB_FURNI_ID_BASE: number = 0x7FFF0000;
    // Official id band of the temporary (Wired) copies: 2147401728..2147418111, right below the Builders Club band.
    private static TEMP_FURNI_ID_BASE: number = 0x7FFEC000;

    public static isBuilderClubId(id: number): boolean
    {
        return (id >= FurniId.BUILDER_CLUB_FURNI_ID_BASE);
    }

    public static isTempId(id: number): boolean
    {
        return ((id >= FurniId.TEMP_FURNI_ID_BASE) && (id < FurniId.BUILDER_CLUB_FURNI_ID_BASE));
    }

    public static isNormalId(id: number): boolean
    {
        return (id < FurniId.TEMP_FURNI_ID_BASE);
    }
}