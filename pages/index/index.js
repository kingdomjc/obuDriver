//index.js
//获取应用实例
const app = getApp()
const frontInterface = require("../../front/front.js")
Page({
  data: {
    motto: 'Hello World',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo')
  },


  open_bt: function() {
    console.log('点击 打开蓝牙 按钮')
    frontInterface.openBluetooth((code,res)=>{
      if (code == 0) {
        console.log('蓝牙已开启')
        wx.showToast({
          title: '蓝牙已开启',
          duration: 2000,
          icon: 'success',
        })
      } else{
        console.log('蓝牙未开启')
        wx.showToast({
          title: '蓝牙未开启',
          duration: 2000,
          icon: 'none',
        })
      }
    })
  },

  sacn_device: function() {
    console.log('点击 扫描设备 按钮')
    frontInterface.bluetoothScan((code,deviceObj)=>{
      if(code == 0){
        console.log("扫描到设备" + deviceObj)
      }else{
        console.log("未扫描到设备")
      }
    })
  },

  connect_device: function() {
    console.log('点击 连接设备 按钮')
    frontInterface.blueConnect((code,message)=>{
      if (code == 0) {
        console.log('连接成功')
      } else {
        console.log('连接失败')
      }
    })
  },

  deploy_device: function() {
    console.log('点击 部署设备 按钮')
    frontInterface.blueDeploy((code,message)=>{
      if (code == 0) {
        console.log('部署成功')
      } else {
        console.log('部署失败')
      }
    })
  },

  close_bt: function() {
    console.log('点击 关闭蓝牙 按钮')
    frontInterface.closeBluetooth((code,message)=>{
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
  },

  init_device: function() {
    console.log('点击 握手指令 按钮')
    frontInterface.initDevice((code, data) => {
      if (code == 0) {
        console.log('握手成功')
      } else {
        console.log('握手失败')
      }
    })
  },

  device_num: function() {
    console.log("获取设备信息")
    frontInterface.getObuNum((code, data) => {
      if (code == 0) {
        console.log("设备序列号为：" + data.obuId)
        console.log("设备电量：" + data.batlev)
        console.log("设备蓝牙MAC：" + data.obuMac)
        console.log("设备版本号：" + data.ver)
      } else {
        console.log('获取失败')
      }
    })
  },
  get16Para: function() {
    console.log('点击 读取0016 按钮')
    frontInterface.get16Para((code,data)=>{
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
  },
  write16:function(){
    let command ="04d696003b0500bad8d7d3dde60000000000000000000000000000313432343031313938383039323934323234000000000000000000000000000000f6c68b8d"
    frontInterface.write16(command,(code, message) => {
      if (code == 0) {
        console.log("写指令成功")
      } else {
        console.log(message)
      }
    })
  },
  get15Para:function(){
    console.log('点击 读取0015 按钮')
    frontInterface.get15Para((code,data)=>{
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
  },
  write15: function () {
    let command = "00d695002fc9bdcef7140100011740140119012302000000082019090620290906bdfa4b375239323900000000000401f6c68b8d"
    frontInterface.write16(command, (code, message) => {
      if (code == 0) {
        console.log("写指令成功")
      } else {
        console.log(message)
      }
    })
  },
  getBalance:function(){
    console.log('点击 获取余额 按钮')
    frontInterface.getBalance((code,data)=>{
      console.log("余额"+data)
    })
  },
  writeMoney:function(){
    let command = "00d695002fc9bdcef7140100011740140119012302000000082019090620290906bdfa4b375239323900000000000401f6c68b8d"
    frontInterface.writeMoney(command, (code, message) => {
      if (code == 0) {
        console.log("写指令成功")
      } else {
        console.log(message)
      }
    })
  },
  getVehiclePara:function(){
    console.log('点击 获取写车辆信息参数')
    frontInterface.getVehiclePara((code,data)=>{
      console.log(data)
    })
  },
  writeVehicle: function () {
    let command = "04d681003fbdfa4b375239323900000000000401000000000000000000000005354341433541000000000000000000003431343430323000000000000000000089f0c470"
    frontInterface.writeVehicle(command, (code, message) => {
      if (code == 0) {
        console.log("写指令成功")
      } else {
        console.log(message)
      }
    })
  },
  getSysPara:function(){
    console.log('点击 获取写系统信息参数')
    frontInterface.getSysPara((code, data) => {
      console.log(data)
    })
  },
  writeSys: function () {
    let command = "04d681002bc9bdcef714010001164100960012a229c8cc201909062029090601bdfa4b375239323900000000be0eb59b"
    frontInterface.writeSys(command, (code, message) => {
      if (code == 0) {
        console.log("写指令成功")
      } else {
        console.log(message)
      }
    })
  },
  obuSetSleepTime:function(){
    frontInterface.obuSetSleepTime("60", (code, message) => {
      if (code == 0) {
        console.log(message)
      } else {
        console.log(message)
      }
    })
  },


  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad: function() {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },
  getUserInfo: function(e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  }
})