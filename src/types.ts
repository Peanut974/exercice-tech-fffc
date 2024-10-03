export type Column = {
    name: string;
    length: number;
    type: ColumnType;
}

export type ColumnType = 'date' | 'chaîne' | 'numérique';