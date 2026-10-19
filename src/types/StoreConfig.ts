export interface StoreConfig {
    name: string; // 对象存储名称
    keyPath: string | string[]; // 主键字段名
    autoIncrement?: boolean; // 是否启用主键自增
    indexes?: {
        name: string;       // 索引名称
        keyPath: string | string[];    // 索引字段路径
        unique?: boolean;   // 是否唯一索引
    }[];
}