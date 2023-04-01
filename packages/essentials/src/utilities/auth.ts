import bcrypt from 'bcryptjs';

export const hashPassword = async (
    plainTextPassword: string
): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(plainTextPassword, salt);
};

export const validatePassword = async (
    plainText: string,
    hash: string
): Promise<boolean> => await bcrypt.compare(plainText, hash);
