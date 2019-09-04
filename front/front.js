// 引入依赖文件
const BleUtil = require("../lib/BleUtil.js")

var device = null
var deviceId = ''

// ----------与蓝牙相关----------

/**
 * 打开蓝牙适配器
 */
var openBluetooth = function() {
  BleUtil.openBle((code) => {
    if (code == 0) {
      console.log('蓝牙已开启')
      wx.showToast({
        title: '蓝牙已开启',
        duration: 2000,
        icon: 'success',
      })
    } else if (code == 1) {
      console.log('蓝牙未开启')
      wx.showToast({
        title: '蓝牙未开启',
        duration: 2000,
        icon: 'none',
      })
    } else {
      console.log('Exception')
    }
  })
}

/**
 * 搜索蓝牙
 */
var bluetoothScan = function() {
  BleUtil.scanBle((object) => {
    device = object
    deviceId = device.deviceId
    console.log(deviceId)
  })
}

/**
 * 连接蓝牙
 */
var blueConnect = function() {
  if (null == device) {
    console.log("device = null")
    return
  }
  BleUtil.connectBle(device, (code) => {
    if (code == 0) {
      console.log('连接成功')
    } else {
      console.log('连接失败')
    }
  })
}

/**
 * 部署
 */
var blueDeploy = function() {
  BleUtil.deployBle(deviceId, (code) => {
    if (code == 0) {
      console.log('部署成功')
    } else {
      console.log('部署失败')
    }
  })
}

/**
 * 关闭蓝牙适配器
 */
var closeBluetooth = function() {
  BleUtil.closeBle((code) => {
    if (code == 0) {
      console.log('蓝牙已关闭')
      wx.showToast({
        title: '蓝牙已关闭',
        duration: 2000,
        icon: 'none',
      })
    } else {
      console.log('蓝牙未关闭')
      wx.showToast({
        title: '蓝牙未关闭',
        duration: 2000,
        icon: 'none',
      })
    }
  })
}

//设置定时任务
var intervalId = setInterval(function() {
  console.log("定时任务")
}, 10000)

// ----------与OBU设备相关----------

//发送握手指令
var initDevice = function(callback) {
  if (typeof callback == 'function') {
    BleUtil.initDevice(deviceId, callback)
  }
  // BleUtil.initDevice(deviceId, (code, data) => {
  //   if (code == 0) {
  //     console.log('握手成功'+data)
  //   } else {
  //     console.log('握手失败'+data)
  //   }
  // })
}

/**
 * 获取设备信息
 */
var getObuNum = function(callback) {
  if (typeof callback == 'function') {
    BleUtil.getObuInfo(deviceId, callback)
  }
}

/**
 * 获取卡片信息
 */
var getCardInfo = function() {
  BleUtil.getCardInfo(deviceId, (code, data) => {
    console.log('回复码：' + code)
    console.log('回复数据：' + data)
  })
}

/**
 * 设置不休眠时间
 */
var setSleepTime = function() {
  BleUtil.obuSetSleepTime('60', deviceId, (code, data) => {
    console.log('回复码：' + code)
    console.log('回复数据：' + data)
  })
}

/**
 * 获取写0016文件的参数
 */
var get16Para = function() {
  BleUtil.get0016Info(deviceId, (code, data) => {

    if (code == 0) {
      console.log('持卡人身份标识:' + data.cardholderID)
      console.log('本系统职工标识:' + data.staffID)
      console.log('持卡人姓名:' + data.cardholderName)
      console.log('持卡人证件号码:' + data.cardNumber)
      console.log('持卡人证件类型:' + data.cardType)
      console.log('随机数:' + data.random)
    } else {
      console.log('读取失败')
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
 */
var get15Para = function() {
  BleUtil.get0015Info(deviceId, (code, data) => {
    if (code == 0) {
      console.log('发卡方标识:' + data.provider)
      console.log('卡片类型:' + data.cardType)
      console.log('卡片版本号:' + data.cardVersion)
      console.log('卡片id:' + data.cardId)
      console.log('启用时间:' + data.signedDate)
      console.log('到期时间:' + data.expiredDate)
      console.log('车牌号码:' + data.vehicleNumber)
      console.log('用户类型:' + data.userType)
      console.log('车辆颜色:' + data.plateColor)
      console.log('车辆类型:' + data.vehicleMode)
      console.log('随机数:' + data.random)
    } else {
      console.log('读取失败')
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
 */
var getBalance = function() {
  BleUtil.getCardBalance(deviceId,(code,data)=>{
    console.log(data)
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
 */
var getVehiclePara = function(callback) {
  if (typeof callback == 'function') {
    BleUtil.getVehiclePara( deviceId, callback)
  }
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
 */
var getSysPara = function(callback) {
  if (typeof callback == 'function') {
    BleUtil.getSysPara(deviceId, callback)
  }
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
  getCardInfo: getCardInfo,
  setSleepTime: setSleepTime
}

//暴露接口对象
module.exports = frontInterface