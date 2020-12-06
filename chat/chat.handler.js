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
    throw error.response.data;
  }
}

/**
 *
 * @param {{email: string, password:string, newPassword: string}} data
 */
async function changeChatUserPassword(data) {
  try {
    const result = await axios({
      method: "POST",
      url: `${chatUrl}/change-user-password`,
      data,
    });
    return result;
  } catch (error) {
    throw error.response.data;
  }
}

/**
 *
 * @param {{username:string, email:string, firstName:string, lastName: string, password: string, phone: string, newPassword: string}} data
 */
async function updateChatUser(data) {
  try {
    const result = await axios({
      method: "POST",
      url: `${chatUrl}/update-user`,
      data,
    });
    return result;
  } catch (error) {
    console.log("ERROR", error.response.data);
    throw { message: error.response.data };
  }
}

async function authenticateChatAccessToken (token) {
  try{
    const result = await axios({
      method:"POST",
      url:`${chatUrl}/authorization`,
      data:{token}
    })
    return result;
  }catch(error){
    console.log("Error", error.response.data);
    throw {message: error.response.data}
  }
}
module.exports = {
  synchronizedChatUser,
  changeChatUserPassword,
  updateChatUser,
  authenticateChatAccessToken
};
