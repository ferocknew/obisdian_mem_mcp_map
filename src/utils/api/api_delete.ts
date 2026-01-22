/**
 * Memory Server API - 删除模块
 * 负责删除实体、观察记录、关系，以及回收站管理（查看、恢复）
 */

import { APISystemClient } from './api_system';

/**
 * 删除观察记录参数
 */
export interface ObservationDeleteParams {
	entityName: string;
	observations: string[];
}

/**
 * 关系删除参数
 */
export interface RelationDeleteParams {
	from: string;
	to: string;
	relationType: string;
}

/**
 * 恢复观察记录参数
 */
export interface RestoreObservationParams {
	entityName: string;
	content: string;
}

/**
 * API 删除客户端（包含回收站功能）
 */
export class APIDeleteClient {
	constructor(private systemClient: APISystemClient) {}

	/**
	 * 逻辑删除实体及其关联关系（移至回收站）
	 *
	 * 注意：此方法将逻辑删除实体（标记为已删除），不会物理删除数据
	 * 已删除的实体可以通过 viewTrash 查看和 restoreDeleted 恢复
	 *
	 * @param entityNames 要删除的实体名称列表
	 */
	async deleteEntities(entityNames: string[]): Promise<any> {
		return this.systemClient.request('/tools/entities/delete', 'POST', { entity_names: entityNames });
	}

	/**
	 * 逻辑删除实体的特定观察记录（移至回收站）
	 *
	 * 注意：此方法将逻辑删除观察记录（标记为已删除），不会物理删除数据
	 * 已删除的观察记录可以通过 viewTrash 查看和 restoreDeleted 恢复
	 *
	 * @param deletions 删除列表
	 */
	async deleteObservations(deletions: ObservationDeleteParams[]): Promise<any> {
		return this.systemClient.request('/tools/entities/delete_observations', 'POST', { deletions });
	}

	/**
	 * 删除图谱中的特定关系
	 *
	 * 注意：此方法将逻辑删除关系（标记为已删除），不会物理删除数据
	 *
	 * @param relations 要删除的关系列表
	 */
	async deleteRelations(relations: RelationDeleteParams[]): Promise<any> {
		return this.systemClient.request('/tools/relations/delete', 'POST', { relations });
	}

	/**
	 * 查看回收站 - 查看已删除的内容
	 *
	 * @param limit 返回的实体数量限制（默认 20）
	 * @param offset 偏移量（用于分页，默认 0）
	 */
	async viewTrash(limit: number = 20, offset: number = 0): Promise<any> {
		return this.systemClient.request(`/tools/trash/view?limit=${limit}&offset=${offset}`, 'GET');
	}

	/**
	 * 恢复已删除的记忆
	 *
	 * 注意：恢复后，实体/观察记录将重新出现在搜索结果中
	 *
	 * @param entityNames 要恢复的实体名称列表
	 * @param observations 要恢复的观察记录列表
	 */
	async restoreDeleted(entityNames?: string[], observations?: RestoreObservationParams[]): Promise<any> {
		const body: any = {};
		if (entityNames) {
			body.entity_names = entityNames;
		}
		if (observations) {
			body.observations = observations;
		}
		return this.systemClient.request('/tools/trash/restore', 'POST', body);
	}
}
