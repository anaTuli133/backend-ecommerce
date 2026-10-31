// Columns written to the Excel file when products are downloaded
const columns = [
    {
        header: 'Product ID',
        cell: (item) => ({ value: item._id?.toString() || '' }),
        width: 25,
    },
    {
        header: 'Title',
        cell: (item) => ({ value: item.title || '' }),
        width: 30,
    },
    {
        header: 'Slug',
        cell: (item) => ({ value: item.slug || '' }),
        width: 30,
    },
    {
        header: 'SKU',
        cell: (item) => ({ value: item.sku || '' }),
        width: 20,
    },
    {
        header: 'Short Description',
        cell: (item) => ({ value: item.shortDescription || '' }),
        width: 35,
    },
    {
        header: 'Description',
        cell: (item) => ({ value: item.description || '' }),
        width: 50,
    },
    {
        header: 'Price',
        cell: (item) => ({ value: item.price ?? 0, type: Number }),
    },
    {
        header: 'Discount Price',
        cell: (item) => ({ value: item.discountPrice ?? 0, type: Number }),
    },
    {
        header: 'Stock',
        cell: (item) => ({ value: item.stock ?? 0, type: Number }),
    },
    {
        header: 'Main Image',
        cell: (item) => ({ value: item.images?.find((img) => img.isMain)?.url || '' }),
        width: 45,
    },
    {
        header: 'All Images',
        cell: (item) => ({ value: item.images?.map((img) => img.url).join(', ') || '' }),
        width: 60,
    },
    {
        header: 'Category ID',
        cell: (item) => ({ value: item.category?.toString() || '' }),
        width: 25,
    },
    {
        header: 'SubCategory ID',
        cell: (item) => ({ value: item.subCategory?.toString() || '' }),
        width: 25,
    },
    {
        header: 'Owner ID',
        cell: (item) => ({ value: item.owner?.toString() || '' }),
        width: 25,
    },
    {
        header: 'Status',
        cell: (item) => ({ value: item.status || '' }),
    },
    {
        header: 'Created At',
        cell: (item) => ({ value: item.createdAt ? new Date(item.createdAt).toLocaleString('en-GB') : '' }),
        width: 25,
    },
]

// Header names that must be in the Excel file when products are uploaded
// (row 1 of the first sheet), and the product field each one fills
const schema = {
    title: {
        column: 'title',
        type: String,
    },
    slug: {
        column: 'slug',
        type: String,
    },
    sku: {
        column: 'sku',
        type: String,
    },
    shortDescription: {
        column: 'shortDescription',
        type: String,
    },
    description: {
        column: 'description',
        type: String,
    },
    price: {
        column: 'price',
        type: Number,
    },
    discountPrice: {
        column: 'discountPrice',
        type: Number,
    },
    stock: {
        column: 'stock',
        type: Number,
    },
    images: {
        column: 'images',
        type: String,
    },
}

module.exports = { schema, columns }
