export class SearchResultProcessor {
	processKeywordSearchResults(results: any): any[] {
		return results.entities || [];
	}

	processSemanticSearchResults(results: any): any[] {
		// 向量搜索可能返回多种格式
		const entities = results.results || results.entities || results.data || [];

		// 如果 results 本身就是数组
		if (Array.isArray(results)) {
			return results;
		}

		return entities;
	}

	extractEntityName(entity: any): string {
		return entity.name || entity.entity_name || '未命名';
	}

	extractEntityType(entity: any): string {
		return entity.entity_type || entity.entityType || entity.type || '未分类';
	}

	extractObservations(entity: any): any[] {
		return entity.observations || [];
	}

	extractSimilarityScore(entity: any): number | undefined {
		return entity.similarity;
	}
}
