import mongoose from 'mongoose'

const StoreSchema = new mongoose.Schema(
    {
        shop: {
            type: String,
            required: true,
            unique: true,
        },

        accessToken: {
            type: String,
            required: true,
        },

        initialSyncDone: {
            type: Boolean,
            default: false,
        }
    }, { timestamps: true }
)

const Store = mongoose.model('Store', StoreSchema)
export default Store