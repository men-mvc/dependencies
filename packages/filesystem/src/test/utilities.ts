import {DeepPartial, UploadedFile} from "@men-mvc/foundation";
import {faker} from "@faker-js/faker";

export const generateUploadedFile = (
    data: DeepPartial<UploadedFile> = {}
): UploadedFile => {
    const defaultData: UploadedFile = {
        filepath: faker.datatype.uuid(),
        size: faker.datatype.number(2),
        originalFilename: `${faker.datatype.uuid()}.png`,
        mimetype: `image/png`
    };

    return new UploadedFile({ ...defaultData, ...data });
};
