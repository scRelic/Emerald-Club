export const formatNumber = (num = 0) => {
    return Number(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}