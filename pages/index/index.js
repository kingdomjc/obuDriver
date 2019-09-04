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
    frontInterface.openBluetooth()
  },

  sacn_device: function() {
    console.log('点击 扫描设备 按钮')
    frontInterface.bluetoothScan()
  },

  connect_device: function() {
    console.log('点击 连接设备 按钮')
    frontInterface.blueConnect()
  },

  deploy_device: function() {
    console.log('点击 部署设备 按钮')
    frontInterface.blueDeploy()
  },

  close_bt: function() {
    console.log('点击 关闭蓝牙 按钮')
    frontInterface.closeBluetooth()
  },

  init_device: function() {
    console.log('点击 握手指令 按钮')
    frontInterface.initDevice((code, data) => {
      if (code == 0) {
        console.log('握手成功' + data)
      } else {
        console.log('握手失败' + data)
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

  card_info: function() {
    console.log('点击 获取卡片信息 按钮')
    frontInterface.getCardInfo()
  },

  get16Para: function() {
    console.log('点击 读取0016 按钮')
    frontInterface.get16Para()
  },
  get15Para:function(){
    console.log('点击 读取0015 按钮')
    frontInterface.get15Para()
  },

  set_sleepTime: function() {
    console.log('点击 设置休眠时间 按钮')
    frontInterface.setSleepTime()
  },
  getBalance:function(){
    console.log('点击 获取余额 按钮')
    frontInterface.getBalance()
  },

  getVehiclePara:function(){
    console.log('点击 获取写车辆信息参数')
    frontInterface.getVehiclePara((code,data)=>{
      console.log(data)
    })
  },
  getSysPara:function(){
    console.log('点击 获取写系统信息参数')
    frontInterface.getSysPara((code, data) => {
      console.log(data)
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