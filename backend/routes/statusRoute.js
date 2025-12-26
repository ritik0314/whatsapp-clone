const express=require('express');
const statusController=require('../controllers/statusController');
const authMiddleware = require('../middleware/authMiddleware');
const { multerMiddleware } = require('../config/cloudinaryConfig');

const router =express.Router();

router.post('/',authMiddleware,multerMiddleware,statusController.createStatus);
router.get('/',authMiddleware,statusController.getStatuses)


//protected router

router.put('/:statusId/view',authMiddleware,statusController.viewStatus)
router.get('/:statusId/viewers',authMiddleware,statusController.getStatusViewers)
router.delete('/:statusId',authMiddleware,statusController.deleteStatus)

module.exports=router;