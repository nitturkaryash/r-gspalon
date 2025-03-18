// Calculate profit for a product
export const calculateProfit = (price, cost) => {
    return parseFloat((price - cost).toFixed(2));
};
// Calculate profit margin as a percentage
export const calculateProfitMargin = (price, cost) => {
    if (price <= 0)
        return 0;
    return parseFloat((((price - cost) / price) * 100).toFixed(2));
};
