// 引入依赖文件
const BleUtil = require("../lib/BleUtil.js")

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
 *          code：1 错误
 * */
var initDevice = function(callback) {
    BleUtil.initDevice(deviceId, (code,data)=>{
      if (code == 0) {
        callback(0, data)
      } else {
        callback(1, "read fail")
      }
    })
}

/**
 * 获取设备信息
 * callback:传递一个函数，参数为code,obj|message
 *          code：0        obj:obu信息   
 *          code：1 错误   message:错误
 */
var getObuNum = function(callback) {
  BleUtil.getObuInfo(deviceId, (code, data) => {
    if (code == 0) {
      callback(0, data)
    } else {
      callback(1, "read fail")
    }
  })
}

/**
 * 获取写0016文件的参数
 * callback:传递一个函数，参数为code,obj|message
 *          code：0        obj:持卡人信息   
 *          code：1 错误   message:错误
 */
var get16Para = function(callback) {
  BleUtil.get0016Info(deviceId, (code, data) => {
    if (code == 0) {
      callback(0,data)
    } else {
      callback(1,"read fail")
    }
  })
}

/**
 * 写0016文件
 */
var write16 = function(cardInfo,callback) {
  if (typeof callback == 'function') {
    BleUtil.set0016Info(cardInfo,deviceId, callback)
  }
}

/**
 * 获取写0015文件的参数
 * callback:传递一个函数，参数为code,obj|message
 *          code：0        obj:卡信息
 *          code：1 错误   message:错误
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
 */
var write15 = function (cardInfo, callback) {
  if (typeof callback == 'function') {
    BleUtil.set0015Info(cardInfo, deviceId, callback)
  }
}

/**
 * 获取余额
 * callback:传递一个函数，参数为code,message
 *          code：0        message:余额
 *          code：1 错误   message:错误
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
 */
var initLoad = function (credit, terminnalNo, pinCode, procType, keyIndex, callback) {
  BleUtil.loadCardInit(credit, terminnalNo, pinCode, procType, keyIndex,deviceId, (code, data) => {
    console.log(data)
  })
}

/**
 * 写金额
 */
var writeMoney = function (comMoney,callback) {
  if (typeof callback == 'function') {
    BleUtil.writeMoney(cardInfo, deviceId, callback)
  }
}

/**
 * 获取写车辆信息参数
 * callback:传递一个函数，参数为code,message
 *          code：0        message:车辆信息参数
 *          code：1 错误   message:错误
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
 */
var writeVehicle = function (commandVeh,callback) {
  if (typeof callback == 'function') {
    BleUtil.writeVehicle(commandVeh,deviceId, callback)
  }
}

/**
 * 获取写系统信息参数
 * callback:传递一个函数，参数为code,data
 *          code：0        data:车辆信息参数
 *          code：1 错误   data:错误
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
 */
var writeSys = function (commandSys, callback) {
  if (typeof callback == 'function') {
    BleUtil.writeSys(commandSys, deviceId, callback)
  }
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
}

//暴露接口对象
module.exports = frontInterface