/**
 * 마크다운 이미지 태그를 완전히 제거
 * @param {string} content - 마크다운 이미지를 포함한 문자열
 * @returns {string} 이미지 태그가 제거된 문자열
 */
export const removeImageMarkdown = (content) => {
    if (!content) return '';
    return content.replace(/!\[.*?\]\(.*?\)/g, '');
};

/**
 * 마크다운 텍스트를 일정 길이로 제한하며 이미지 태그는 제거
 * @param {string} content - 원본 마크다운 텍스트
 * @param {number} maxLength - 최대 길이
 * @returns {string} 제한된 길이의 텍스트
 */
export const truncateContentWithoutImages = (content, maxLength = 100) => {
    if (!content) return '';
    const cleaned = removeImageMarkdown(content).trim();
    
    // 연속된 공백을 하나로 줄임
    const singleSpaced = cleaned.replace(/\s+/g, ' ');
    
    if (singleSpaced.length <= maxLength) return singleSpaced;
    return singleSpaced.substring(0, maxLength) + "...";
};

/**
 * 문자열에서 마크다운 이미지 패턴이 있는지 확인
 * @param {string} content - 확인할 문자열
 * @return {boolean} 이미지 마크다운 패턴이 있으면 true, 없으면 false
 */
export const hasImageMarkdown = (content) => {
    if(!content) {
        return false;
    }
    
    const imagePattern = /!\[.*?\]\(.*?\)/;
    return imagePattern.test(content);
}

/**
 * 문자열에서 첫 번째 이미지 URL을 추출
 * @param {string} content - 마크다운 이미지를 포함할 문자열
 * @return {string | null} - 첫 번째 이미지 URL 또는 이미지가 없으면 null
 */
export const extractFirstImageUrl = (content) => {
    if (!content) return null;
    const imagePattern = /!\[.*?\]\((.*?)\)/;
    const match = content.match(imagePattern);
    // URL 전체를 반환 (파라미터 포함)
    return match ? match[1] : null;
};

/**
 * 문자열에서 모든 이미지 URL을 추출
 * @param {string} content - 마크다운 이미지를 포함한 문자열
 * @returns {string[]} 추출된 이미지 URL 배열
 */
export const extractAllImageUrls = (content) => {
    if (!content) {
        return [];
    }
    const imagePattern = /!\[.*?\]\((.*?)\)/g;
    const urls = [];
    let match;
    
    while ((match = imagePattern.exec(content)) !== null) {
        urls.push(match[1].split('?')[0]);
    }
    
    return urls;
};
    
/**
 * 마크다운 이미지 태그를 대체 텍스트로 변경
 * @param {string} content - 마크다운 이미지를 포함한 문자열
 * @param {string} replacement - 대체할 텍스트, 기본값은 '[이미지]'
 * @returns {string} 이미지 태그가 대체된 문자열
 */
export const replaceImageMarkdown = (content, replacement = '[이미지]') => {
    if (!content) {
        return '';
    } 
    return content.replace(/!\[.*?\]\(.*?\)/g, replacement);
};

/**
   * 마크다운 텍스트를 일정 길이로 제한하며 이미지 태그는 대체 텍스트로 변환
   * @param {string} content - 원본 마크다운 텍스트
   * @param {number} maxLength - 최대 길이
   * @param {string} replacement - 이미지 태그 대체 텍스트
   * @returns {string} 제한된 길이의 텍스트
   */
export const truncateContentWithImageReplacement = (content, maxLength = 100, replacement = '[이미지]') => {
    if (!content) {
        return '';
    }
    const replaced = replaceImageMarkdown(content, replacement);
    
    if (replaced.length <= maxLength) return replaced;
    return replaced.substring(0, maxLength) + "...";
};