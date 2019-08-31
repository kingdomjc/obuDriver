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
var initDevice = function (callback) {
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
var getObuNum = function (callback) {
  if (typeof callback == 'function') {
    BleUtil.getObuInfo(deviceId,callback)
  }
}

/**
 * 获取写0016文件的参数
 */
var Get16Para = function() {}

/**
 * 写0016文件
 */
var Write16 = function() {}

/**
 * 获取写0015文件的参数
 */
var Get15Para = function() {}

/**
 * 写0015文件
 */
var Write15 = function() {}

/**
 * 获取余额
 */
var getBalance = function() {}

/**
 * 圈存初始化
 */
var initLoad = function() {}

/**
 * 写金额
 */
var WriteMoney = function() {}

/**
 * 获取写车辆信息的参数
 */
var GetVehiclePara = function() {}

/**
 * 写车辆信息文件
 */
var WriteVehicle = function() {}

/**
 * 获取写系统信息参数
 */
var GetSysPara = function() {}

/**
 * 写系统信息文件
 */
var WriteSys = function() {}

/**
 * 获取S/N号
 */
var getSN = function() {}


//接口对象
var frontInterface = {
  openBluetooth: openBluetooth,
  bluetoothScan: bluetoothScan,
  blueConnect: blueConnect,
  blueDeploy: blueDeploy,
  closeBluetooth: closeBluetooth,
  initDevice: initDevice,
  Get16Para: Get16Para,
  Write16: Write16,
  Get15Para: Get15Para,
  Write15: Write15,
  getBalance: getBalance,
  initLoad: initLoad,
  WriteMoney: WriteMoney,
  GetVehiclePara: GetVehiclePara,
  WriteVehicle: WriteVehicle,
  GetSysPara: GetSysPara,
  WriteSys: WriteSys,
  getSN: getSN,
  getObuNum: getObuNum
}

//暴露接口对象
module.exports = frontInterface