// 引入依赖文件
const BleUtil = require("./BleUtil.js")

var device = null //设备
var deviceId = '' //设备标识

// ----------与蓝牙相关----------

/**
 * 打开蓝牙适配器
 * callback:传递一个函数，参数为code，message
 *          code：0 正常
 *          code：1 错误
 */
var openBluetooth = function (callback) {
  BleUtil.openBle(code=>{
    if(code==0){
      callback(0,"open ok")
    }else{
      callback(1,"no open ble")
    }
  })
}

/**
 * 搜索蓝牙
 * callback:传递一个函数，参数为code，deviceObj|message
 *        code：0          deviceObj:找到的设备蓝牙信息
 *        code：1 错误     message:错误信息
 *        
 */
var bluetoothScan = function(callback) {
  BleUtil.scanBle((code,deviceObj) => {
    if(code==0){
      device = deviceObj
      deviceId = device.deviceId
      callback(0,deviceObj)
    }else{
      callback(1,"No find")
    }
  })
}

/**
 * 连接蓝牙
 * callback:传递一个函数，参数为code,message
 *          code：0
 *          code：1 错误
 */
var blueConnect = function(callback) {
  if (null == device) {
    callback(1,"no find ble")
    return
  }
  BleUtil.connectBle(device, (code) => {
    if (code == 0) {
      callback(0,"connect ok")
    } else {
      callback(1,"no connect")
    }
  })
}

/**
 * 部署
 * callback:传递一个函数，参数为code,message
 *          code：0
 *          code：1 错误
 */
var blueDeploy = function(callback) {
  BleUtil.deployBle(deviceId, (code) => {
    if (code == 0) {
      callback(0,"success")
    } else {
      callback(1,'fail')
    }
  })
}

/**
 * 关闭蓝牙适配器
 * callback:传递一个函数，参数为code,message
 *          code：0
 *          code：1 错误
 */
var closeBluetooth = function(callback) {
  BleUtil.closeBle((code) => {
    if (code == 0) {
      callback(0,"close ok")
    } else {
      callback(1, "close fail")
    }
  })
}

// ----------与OBU设备相关----------

/**
 * 发送握手指令
 * callback:传递一个函数，参数为code,message
 *          code：0 
 *          code：1  data :错误返回码
 * */
var initDevice = function(callback) {
    BleUtil.initDevice(deviceId, (code,data)=>{
      if (code == 0) {
        callback(0, data)
      } else {
        callback(1, data)
      }
    })
}

/**
 * 获取设备信息
 * callback:传递一个函数，参数为code,obj|message
 *          code：0        obj:obu信息   
 *          code：1 错误   data:错误返回码
 */
var getObuNum = function(callback) {
  BleUtil.getObuInfo(deviceId, (code, data) => {
    if (code == 0) {
      callback(0, data)
    } else {
      callback(1, data)
    }
  })
}

/**
 * 获取写0016文件的参数
 * callback:传递一个函数，参数为code,obj|message
 *          code：0        obj:持卡人信息
 *                              cardholderID:持卡人身份标识
                                staffID: 本系统职工标识
                                cardholderName: 持卡人姓名
                                cardNumber: 持卡人证件号码
                                cardType: 持卡人证件类型
                                random: 随机数
                                cardId:卡片id
 *          code：1 错误   data:错误返回码
 */
var get16Para = function(callback) {
  BleUtil.get0016Info(deviceId, (code, data) => {
    if (code == 0) {
      callback(0,data)
    } else {
      callback(1,data)
    }
  })
}

/**
 * 写0016文件
 * cardInfo:通过拿到0016文件的参数，向后台请求相应数据时的回应
 *
 * callback:函数，参数为（code,data）
 *    if code==0: success
 *    elif code==1:data:错误返回码
 */
var write16 = function(cardInfo,callback) {
  BleUtil.set0016Info(cardInfo,deviceId, (code, data) => {
    if (code == 0) {
      callback(0, "write ok")
    } else {
      callback(1, data)
    }
  })
}

/**
 * 获取写0015文件的参数
 * callback:传递一个函数，参数为code,obj|message
 *          code：0        obj:卡信息
 *                            provider: 发卡方标识
                              cardType: 卡片类型
                              cardVersion: 卡片版本号
                              cardId: 卡片id
                              signedDate: 启用时间
                              expiredDate: 到期时间
                              vehicleNumber: 车牌号码
                              userType: 用户类型
                              plateColor: 车辆颜色
                              vehicleMode: 车辆类型
                              random:随机数
 *        code：1 错误   message:错误
 */
var get15Para = function(callback) {
  BleUtil.get0015Info(deviceId, (code, data) => {
    if (code == 0) {
      callback(0,data)
    } else {
      callback(1, '读取失败')
    }
  })
}

/**
 * 写0015文件
 * cardInfo:通过拿到0015文件的参数，向后台请求相应数据时的回应
 * 
 * callback:函数，参数为（code,data）
 *    if code==0: success
 *    elif code==1:错误返回码
 */
var write15 = function (cardInfo, callback) {
  BleUtil.set0015Info(cardInfo, deviceId, (code, data) => {
    if (code == 0) {
      callback(0, "write ok")
    } else {
      callback(1, data)
    }
  })
}

/**
 * 获取余额
 * callback:传递一个函数，参数为code,data
 *          code：0        data:余额（10进制）
 *          code：1 错误   data:错误返回码
 */
var getBalance = function(callback) {
  BleUtil.getCardBalance(deviceId,(code,data)=>{
    if(code==0){
      callback(0,data)
    }else{
      callback(1, data)
    }
  })
}

/**
 * 圈存初始化
 * recharge:   要存的钱数(字符串格式)
 * terminnalNo:终端机编号(字符串格式)
 * pinCode:    卡片密码（字符串格式）
 * 
 * callback:传递一个函数，参数为（code,data）
 *          if  code == 0  data{
 *                            balance: 余额
                              serial: 联机交易序列号
                              icRandom: 随机数
                              mac1: mac1,
                              cardnum: 卡片id
                              money: 要存的钱数
 *                            }
 *          else if(code ==1  or other) data:错误返回码
 *                            
 */
var initLoad = function (recharge, terminnalNo,pinCode,callback) {
  BleUtil.loadCardInit(recharge, terminnalNo, pinCode, "02", "01", deviceId, (code, data) => {
    if (code == 0) {
      callback(0, data)
    } else {
      callback(1, data)
    }
  })
}

/**
 * 写金额
 * cardInfo:通过拿到初始化圈存的参数，向后台请求相应数据时的回应
 * callback:函数，参数为（code,data）
 *    if code==0: success
 *    elif code==1: data:错误返回码
 */
var writeMoney = function (cardInfo,callback) {
  BleUtil.loadCard(cardInfo, deviceId, (code, data) => {
    if (code == 0) {
      callback(0, "write ok")
    } else {
      callback(1, data)
    }
  })
}

/**
 * 获取写车辆信息参数
 * callback:传递一个函数，参数为code,data
 *          code：0        data:{
 *                             random: 随机数
                               contractId: 合同序列号
                               cardId: 卡片id
 *                                      }
 *          code：1        data:错误返回码
 */
var getVehiclePara = function(callback) {
  BleUtil.getVehiclePara( deviceId, (code,data)=>{
    if(code==0){
      callback(0,data)
    }else{
      callback(1,data)
    }
  })
}

/**
 * 写车辆信息文件
 * cardInfo:通过拿到的车辆信息参数，向后台请求相应数据时的回应
 * callback:函数，参数为（code,data）
 *    if code==0: success
 *    elif code==1: data:错误返回码
 */
var writeVehicle = function (cardInfo,callback) {
  BleUtil.writeVehicle(cardInfo, deviceId, (code, data) => {
    if (code == 0) {
      callback(0, "write ok")
    } else {
      callback(1, data)
    }
  })
}

/**
 * 获取写系统信息参数
 * callback:传递一个函数，参数为code,data
 *          code：0        data:{
 *                             random: 随机数
                               sysInfo:系统信息
 *                        }
 *          code：1        data:错误返回码
 */
var getSysPara = function(callback) {
    BleUtil.getSysPara(deviceId, (code,data)=>{
      if (code == 0) {
        callback(0, data)
      } else {
        callback(1, data)
      }
    })
}

/**
 * 写系统信息文件
 *  cardInfo:通过拿到的系统信息参数，向后台请求相应数据时的回应
 *  callback:函数，参数为（code,data）
 *    if code==0: success
 *    elif code==1: data错误返回码
 */
var writeSys = function (cardInfo, callback) {
  BleUtil.writeSys(cardInfo, deviceId, (code, data) => {
    if (code == 0) {
      callback(0, "write ok")
    } else {
      callback(1,data)
    }
  })
}

/**
 * 设置obu保持蓝牙链接时长
 * time:单位为秒（字符串格式）
 * callback:函数，参数为（code,data）
 *    if code==0: success
 *    elif code==1:fail
 */
var obuSetSleepTime=function(time,callback){
  BleUtil.obuSetSleepTime(time, deviceId, (code, data) => {
    if (code == 0) {
      callback(0, "set ok")
    } else {
      callback(1, "set fail")
    }
  })
}

//接口对象
var frontInterface = {
  openBluetooth: openBluetooth,
  bluetoothScan: bluetoothScan,
  blueConnect: blueConnect,
  blueDeploy: blueDeploy,
  closeBluetooth: closeBluetooth,
  initDevice: initDevice,
  get16Para: get16Para,
  write16: write16,
  get15Para: get15Para,
  write15: write15,
  getBalance: getBalance,
  initLoad: initLoad,
  writeMoney: writeMoney,
  getVehiclePara: getVehiclePara,
  writeVehicle: writeVehicle,
  getSysPara: getSysPara,
  writeSys: writeSys,
  getObuNum: getObuNum,
  obuSetSleepTime:obuSetSleepTime,
}

//暴露接口对象
module.exports = frontInterface