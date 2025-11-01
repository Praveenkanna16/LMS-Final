const axios = require('axios');
const logger = require('../config/logger');

/**
 * Cashfree Payout Service
 * Handles teacher payout transfers via Cashfree
 */

const CASHFREE_PAYOUT_BASE_URL = process.env.CASHFREE_PAYOUT_MODE === 'production'
  ? 'https://payout-api.cashfree.com/payout/v1'
  : 'https://payout-gamma.cashfree.com/payout/v1';

/**
 * Get Cashfree authentication token
 */
const getAuthToken = async () => {
  try {
    const response = await axios.post(
      `${CASHFREE_PAYOUT_BASE_URL}/authorize`,
      {
        clientId: process.env.CASHFREE_CLIENT_ID,
        clientSecret: process.env.CASHFREE_CLIENT_SECRET
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.data.token;
  } catch (error) {
    logger.error('Failed to get Cashfree auth token:', error.response?.data || error.message);
    throw new Error('Cashfree authentication failed');
  }
};

/**
 * Add beneficiary (bank account) for payouts
 */
const addBeneficiary = async (beneficiaryDetails) => {
  try {
    const token = await getAuthToken();
    
    const payload = {
      beneId: beneficiaryDetails.beneId,
      name: beneficiaryDetails.name,
      email: beneficiaryDetails.email,
      phone: beneficiaryDetails.phone,
      bankAccount: beneficiaryDetails.bankAccount,
      ifsc: beneficiaryDetails.ifsc,
      address1: beneficiaryDetails.address || 'NA',
      city: beneficiaryDetails.city || 'NA',
      state: beneficiaryDetails.state || 'NA',
      pincode: beneficiaryDetails.pincode || '000000'
    };

    const response = await axios.post(
      `${CASHFREE_PAYOUT_BASE_URL}/addBeneficiary`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    logger.info(`Beneficiary added: ${beneficiaryDetails.beneId}`);
    return response.data;
  } catch (error) {
    logger.error('Failed to add beneficiary:', error.response?.data || error.message);
    
    // If beneficiary already exists, that's okay
    if (error.response?.data?.subCode === 'BENEFICIARY_ALREADY_EXISTS') {
      return { success: true, message: 'Beneficiary already exists' };
    }
    
    throw new Error(`Failed to add beneficiary: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Request payout transfer
 */
const requestTransfer = async (transferDetails) => {
  try {
    const token = await getAuthToken();
    
    const payload = {
      beneId: transferDetails.beneId,
      amount: transferDetails.amount.toString(),
      transferId: transferDetails.transferId,
      transferMode: transferDetails.transferMode || 'banktransfer',
      remarks: transferDetails.remarks || 'Teacher payout'
    };

    const response = await axios.post(
      `${CASHFREE_PAYOUT_BASE_URL}/requestTransfer`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    logger.info(`Transfer requested: ${transferDetails.transferId}`);
    return {
      success: true,
      transferId: response.data.data.transferId,
      referenceId: response.data.data.referenceId,
      status: response.data.data.status,
      data: response.data.data
    };
  } catch (error) {
    logger.error('Failed to request transfer:', error.response?.data || error.message);
    throw new Error(`Transfer failed: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Get transfer status
 */
const getTransferStatus = async (transferId, referenceId = null) => {
  try {
    const token = await getAuthToken();
    
    let url = `${CASHFREE_PAYOUT_BASE_URL}/getTransferStatus`;
    const params = {};
    
    if (referenceId) {
      params.referenceId = referenceId;
    } else {
      params.transferId = transferId;
    }

    const response = await axios.get(url, {
      params,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return {
      success: true,
      status: response.data.data.transfer.status,
      utr: response.data.data.transfer.utr,
      acknowledged: response.data.data.transfer.acknowledged,
      data: response.data.data
    };
  } catch (error) {
    logger.error('Failed to get transfer status:', error.response?.data || error.message);
    throw new Error(`Failed to get status: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Request UPI payout
 */
const requestUPITransfer = async (transferDetails) => {
  try {
    const token = await getAuthToken();
    
    const payload = {
      beneId: transferDetails.beneId,
      amount: transferDetails.amount.toString(),
      transferId: transferDetails.transferId,
      transferMode: 'upi',
      remarks: transferDetails.remarks || 'Teacher payout',
      vpa: transferDetails.vpa // UPI ID
    };

    const response = await axios.post(
      `${CASHFREE_PAYOUT_BASE_URL}/requestTransfer`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    logger.info(`UPI transfer requested: ${transferDetails.transferId}`);
    return {
      success: true,
      transferId: response.data.data.transferId,
      referenceId: response.data.data.referenceId,
      status: response.data.data.status,
      data: response.data.data
    };
  } catch (error) {
    logger.error('Failed to request UPI transfer:', error.response?.data || error.message);
    throw new Error(`UPI transfer failed: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Get account balance
 */
const getBalance = async () => {
  try {
    const token = await getAuthToken();
    
    const response = await axios.get(
      `${CASHFREE_PAYOUT_BASE_URL}/getBalance`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    return {
      success: true,
      balance: parseFloat(response.data.data.balance),
      availableBalance: parseFloat(response.data.data.availableBalance)
    };
  } catch (error) {
    logger.error('Failed to get balance:', error.response?.data || error.message);
    throw new Error('Failed to get balance');
  }
};

/**
 * Validate bank account
 */
const validateBankAccount = async (name, phone, bankAccount, ifsc) => {
  try {
    const token = await getAuthToken();
    
    const response = await axios.post(
      `${CASHFREE_PAYOUT_BASE_URL}/validation/bankDetails`,
      {
        name,
        phone,
        bankAccount,
        ifsc
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      valid: response.data.data.isValid,
      nameAtBank: response.data.data.nameAtBank,
      message: response.data.message
    };
  } catch (error) {
    logger.error('Failed to validate bank account:', error.response?.data || error.message);
    return {
      success: false,
      valid: false,
      message: error.response?.data?.message || 'Validation failed'
    };
  }
};

/**
 * Process payout (Complete workflow)
 */
const processPayout = async (payoutDetails) => {
  try {
    // 1. Add/update beneficiary
    await addBeneficiary({
      beneId: `TEACHER_${payoutDetails.teacherId}`,
      name: payoutDetails.teacherName,
      email: payoutDetails.teacherEmail,
      phone: payoutDetails.teacherPhone,
      bankAccount: payoutDetails.bankAccount,
      ifsc: payoutDetails.ifsc,
      address: payoutDetails.address,
      city: payoutDetails.city,
      state: payoutDetails.state,
      pincode: payoutDetails.pincode
    });

    // 2. Request transfer
    const transferResult = await requestTransfer({
      beneId: `TEACHER_${payoutDetails.teacherId}`,
      amount: payoutDetails.amount,
      transferId: payoutDetails.payoutId,
      transferMode: 'banktransfer',
      remarks: `Payout for ${payoutDetails.teacherName}`
    });

    return transferResult;
  } catch (error) {
    logger.error('Failed to process payout:', error);
    throw error;
  }
};

module.exports = {
  getAuthToken,
  addBeneficiary,
  requestTransfer,
  requestUPITransfer,
  getTransferStatus,
  getBalance,
  validateBankAccount,
  processPayout
};
