export class UploadedFile {
    public originalFilename: string;
    public mimetype!: string;
    public filepath!: string;
    public size!: number;
    public hash?: string | null;
    constructor(args: {
        originalFilename: string;
        mimetype: string;
        filepath: string;
        size: number;
        hash?: string | null;
    }) {
        this.originalFilename = args.originalFilename;
        this.mimetype = args.mimetype;
        this.filepath = args.filepath;
        this.size = args.size;
        this.hash = args.hash;
    }
}
