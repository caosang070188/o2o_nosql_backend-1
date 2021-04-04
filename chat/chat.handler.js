const axios = require("axios");
const chatConfigs = require("./chat.configs");

const { chatUrl } = chatConfigs;
/**
 *
 * @param {{username:string, email:string, firstName:string, lastName: string, password: string, phone: string}} userData
 */

async function synchronizedChatUser(userData) {
  try {
    const result = await axios({
      method: "POST",
      // url: "http://localhost:3000/api/authenticate",
      url: `${chatUrl}/authenticate`,
      data: userData,
    });
    return result;
  } catch (error) {
    console.log("ERROR", error);
    throw error.response ? error.response.data : error;
  }
}

/**
 *
 * @param {{email: string, password:string, newPassword: string, access_token: string}} data
 */
async function changeChatUserPassword(data) {
  try {
    const { access_token, ...other } = data;
    const result = await axios({
      method: "POST",
      url: `${chatUrl}/change-user-password`,
      data: other,
      headers: {
        Authorization: "Bearer " + data.access_token,
      },
    });
    return result;
  } catch (error) {
    console.log("error", error);
    throw error.response ? error.response.data : error;
  }
}

/**
 *
 * @param {{username:string, email:string, firstName:string, lastName: string, password: string, phone: string, newPassword: string, access_token: string}} data
 */
async function updateChatUser(data) {
  try {
    const { access_token, ...other } = data;
    const result = await axios({
      method: "POST",
      url: `${chatUrl}/update-user`,
      data: other,
      headers: {
        Authorization: "Bearer " + data.access_token,
      },
    });
    return result;
  } catch (error) {
    console.log("ERROR", error.response.data);
    throw { message: error.response ? error.response.data : error };
  }
}

async function authenticateChatAccessToken(token) {
  try {
    const result = await axios({
      method: "POST",
      url: `${chatUrl}/authorization`,
      headers: { Authorization: "Bearer " + token },
      data: { token },
    });
    return result;
  } catch (error) {
    console.log("Error", error.response.data);
    throw { message: error.response ? error.response.data : error };
  }
}

async function updateDeviceToken({ token, email, deviceId, deviceType }) {
  try {
    const result = await axios({
      method: "POST",
      url: `${chatUrl}/update-device-token`,
      data: { token, email, deviceId, deviceType },
    });
    return result;
  } catch (error) {
    console.log("Update deviceToken chat user error", error.response.data);
    throw { message: error.response ? error.response.data : error };
  }
}
module.exports = {
  synchronizedChatUser,
  changeChatUserPassword,
  updateChatUser,
  authenticateChatAccessToken,
  updateDeviceToken,
};
