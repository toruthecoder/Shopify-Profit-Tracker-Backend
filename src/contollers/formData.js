import MontlyCosts from '../model/form.js'

export const saveFormData = async (req, res) => {
    try {
        console.log("BODY:", req.body)
        const {
            month,
            paymentFees,
            transactionFees,
            packagingCosts,
            deliveryCosts,
            appCosts,
            shopifyCosts,
            marketingCosts
        } = req.body;
        let costs = await MontlyCosts.findOne({ month })
        if (costs) {
            costs = await MontlyCosts.findOneAndUpdate({ month }, {
                paymentFees,
                transactionFees,
                packagingCosts,
                deliveryCosts,
                appCosts,
                shopifyCosts,
                marketingCosts
            }, { new: true })
        } else {
            costs = await MontlyCosts.create({
                month,
                paymentFees,
                transactionFees,
                packagingCosts,
                deliveryCosts,
                appCosts,
                shopifyCosts,
                marketingCosts
            })
        }
        res.status(200).json({ success: true, costs })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const getFormData = async (req, res) => {
    try {
        const costs = await MontlyCosts.find().sort({ createdAt: -1 })
        res.status(200).json({ success: true, costs })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
