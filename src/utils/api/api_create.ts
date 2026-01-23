/**
 * Memory Server API - 创建模块
 * 负责创建实体、添加观察记录、创建关系、生成向量等写入操作
 */

import { APISystemClient } from './api_system';

/**
 * 实体创建参数
 */
export interface EntityCreateParams {
	name: string;
	entityType: string;
	observations?: string[];
}

/**
 * 观察记录添加参数
 */
export interface ObservationAddParams {
	entityName: string;
	content: string;
}

/**
 * 关系创建参数
 */
export interface RelationCreateParams {
	from: string;
	to: string;
	relationType: string;
}

/**
 * 观察记录更新参数（通过 ID）
 */
export interface ObservationUpdateByIdParams {
	observation_id: string;
	content: string;
}

/**
 * API 创建客户端
 */
export class APICreateClient {
	constructor(private systemClient: APISystemClient) {}

	/**
	 * 创建实体
	 *
	 * @param entities 实体列表
	 */
	async createEntities(entities: EntityCreateParams[]): Promise<any> {
		return this.systemClient.request('/tools/entities/create', 'POST', { entities });
	}

	/**
	 * 添加观察记录
	 *
	 * 支持两种格式：
	 * 1. 扁平格式（每个观察一个对象）
	 * 2. 嵌套格式（按实体分组）
	 *
	 * @param observations 观察记录列表
	 */
	async addObservations(observations: ObservationAddParams[]): Promise<any> {
		return this.systemClient.request('/tools/entities/add_observations', 'POST', { observations });
	}

	/**
	 * 通过 ID 更新观察记录
	 *
	 * @param updates 更新列表
	 */
	async updateObservationsById(updates: ObservationUpdateByIdParams[]): Promise<any> {
		return this.systemClient.request('/tools/entities/update_observations', 'POST', { updates });
	}

	/**
	 * 创建关系
	 *
	 * @param relations 关系列表
	 * @param autoCreateEntities 是否自动创建缺失的实体（默认 false）
	 */
	async createRelations(relations: RelationCreateParams[], autoCreateEntities: boolean = false): Promise<any> {
		const url = `/tools/relations/create?auto_create_entities=${autoCreateEntities}`;
		return this.systemClient.request(url, 'POST', { relations });
	}

	/**
	 * 生成向量（用于语义搜索）
	 *
	 * @param entityNames 指定实体名称列表，为空则处理缺失向量的实体
	 * @param limit 处理数量限制（仅当 entityNames 为空时生效），默认 20
	 */
	async generateEmbeddings(entityNames?: string[], limit: number = 20): Promise<any> {
		const url = `/tools/search/embeddings?limit=${limit}`;
		const body = entityNames ? { entity_names: entityNames } : { entity_names: null };
		return this.systemClient.request(url, 'POST', body);
	}
}
