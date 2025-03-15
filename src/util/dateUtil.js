export const formatDate = (dateString) => {
    if (!dateString) return '날짜 없음';
    
    // ISO 문자열인지 확인
    if (typeof dateString === 'string' && dateString.includes('T')) {
        return new Date(dateString).toLocaleDateString();
    }
    
    // 유닉스 타임스탬프인지 확인 (숫자인 경우)
    if (!isNaN(dateString)) {
        return new Date(Number(dateString)).toLocaleDateString();
    }
    
    // 다른 형식의 날짜 문자열 시도
    const date = new Date(dateString);
        return !isNaN(date) ? date.toLocaleDateString() : '유효하지 않은 날짜';
};