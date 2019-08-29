const ArtcDataUtil = require("./ArtcDataUtil.js")
const gbk = require("./gbk.js")
const FUNCTION = "function"
const SERVICE_UUID = "0000FEE7-0000-1000-8000-00805F9B34FB"
const WRITE_UUID = "0000FEC7-0000-1000-8000-00805F9B34FB"
const READ_UUID = "0000FEC8-0000-1000-8000-00805F9B34FB"
const DEVICE_FLAG = ""

var _bleDeviceId

/**
 * 打开蓝牙适配器
 */
var openBle = function (callback) {
  wx.openBluetoothAdapter({
    success: (res) => {
      typeof callback == FUNCTION && callback(0)
    },
    fail: () => {
      typeof callback == FUNCTION && callback(1)
    },
  })

}

/**
 * 关闭蓝牙适配器
 */
var closeBle = function (callback) {
  wx.closeBluetoothAdapter({
    success: (res) => {
      typeof callback == FUNCTION && callback(0)
    },
    fail: () => {
      typeof callback == FUNCTION && callback(1)
    },
  })
}

/**
 * 停止搜索
 */
var stopScan = function () {
  wx.stopBluetoothDevicesDiscovery({
    success: (res) => { },
  })
}


/**
 * 搜索蓝牙设备
 */
var scanBle = function (callback) {
  wx.onBluetoothDeviceFound((res) => {
    for (let i = 0; i < res.devices.length; i ++) {
      if (DEVICE_FLAG == "" || (res.devices[i].localName + "").startsWith(DEVICE_FLAG)) {
        typeof callback == FUNCTION && callback(res.devices[i])
        break
      }
    }
  })
  wx.startBluetoothDevicesDiscovery({
    // services: [SERVICE_UUID],
    allowDuplicatesKey: false,
    success: (res) => {
    },
    fail: () => {
      typeof callback == FUNCTION && callback(1)
    },
  })
}

/**
 * 连接设备
 */
var connectBle = function (device, callback) {
  _bleDeviceId = device.deviceId
  stopScan()
  wx.onBLEConnectionStateChange((res) => {
    if (res.deviceId == _bleDeviceId) {
      if (res.connected == true) {
        typeof callback == FUNCTION && callback(0)
      } else {
        console.log("连接断开")
      }
    }
  })
  wx.createBLEConnection({
    deviceId: _bleDeviceId,
    timeout: 20 * 1000,
    success: (res) => {
    },
    fail: () => {
      typeof callback == FUNCTION && callback(1)
    },
  })
}

/**
 * 配置连接外设
 */
var deployBle = function (callback) {
  wx.getBLEDeviceServices({
    deviceId: _bleDeviceId,
    success: (res) => {
      for (let i = 0; i < res.services.length; i++) {
        if ((res.services[i].uuid + "") == SERVICE_UUID) {
          wx.getBLEDeviceCharacteristics({
            deviceId: _bleDeviceId,
            serviceId: SERVICE_UUID,
            success: (res) => {
              let haveRead = false
              let haveWrite = false
              for (let j = 0; j < res.characteristics.length; j++) {
                let chr = res.characteristics[j].uuid + ""
                if (chr == READ_UUID) {
                  haveRead = true
                }
                else if (chr == WRITE_UUID) {
                  haveWrite = true
                }
              }
              if (haveRead == true && haveWrite == true) {
                wx.notifyBLECharacteristicValueChange({
                  deviceId: _bleDeviceId,
                  serviceId: SERVICE_UUID,
                  characteristicId: READ_UUID,
                  state: true,
                  success: (res) => {
                    typeof callback == FUNCTION && callback(0)
                  },
                  fail: () => {
                    typeof callback == FUNCTION && callback(1)
                  }
                })
              } else {
                typeof callback == FUNCTION && callback(1)
              }
            },
            fail: () => {
              typeof callback == FUNCTION && callback(1)
            }
          })
          return
        }
      }
      typeof callback == FUNCTION && callback(1)
    },
    fail: () => {
      typeof callback == FUNCTION && callback(1)
    }
  })
  wx.onBLECharacteristicValueChange((res) => {
    if (res.deviceId == _bleDeviceId && res.serviceId == SERVICE_UUID && res.characteristicId == READ_UUID) {
      let hexData = ArtcDataUtil.buf2hex(res.value)
      console.log("接收：" + hexData)
      analyticData(hexData)
    }
  })
}


/**
 * 断开蓝牙连接
 */
var disconnectBle = function (callback) {
  wx.closeBLEConnection({
    deviceId: _bleDeviceId,
    success: (res) => {
      typeof callback == FUNCTION && callback(0)
    },
    fail: () => {
      typeof callback == FUNCTION && callback(1)
    }
  })
}


var _sendCallback
var _sendDatas
var _sendIndex = 0
/**
 * 发送数据
 */
var sendData = function (datas, callback) {
  _pakectData = ""
  _packetLength = 0
  _pakectArray = new Array()
  _pakectCount = 0
  _sendCallback = callback
  _sendDatas = datas
  _sendIndex = 0
  doSendData()
}

var doSendData = function () {
  if (_sendIndex < _sendDatas.length) {
    let value = _sendDatas[_sendIndex]
    wx.writeBLECharacteristicValue({
      deviceId: _bleDeviceId,
      serviceId: SERVICE_UUID,
      characteristicId: WRITE_UUID,
      value: value,
      success: (res) => {
        console.log("发送：" + ArtcDataUtil.buf2hex(value))
        
        setTimeout(() => {
          _sendIndex++
          doSendData()
        }, 10)
      },
      fail: () => {
        typeof _sendCallback == FUNCTION && _sendCallback(1, "发送失败")
      }
    })
  }
}


var _pakectData = ""
var _packetLength = 0
var _pakectArray = new Array()
var _pakectCount = 0
/**
 * 解析数据
 */
var analyticData = function (data) {
  if (_pakectData.length == 0) {
    if (data.startsWith("33") && data.length >= 8) {
      _packetLength = parseInt(data.slice(4, 6), 16) * 2 + 8
    } else {
      typeof _sendCallback == FUNCTION && _sendCallback(1, "LEN字段缺失")
      return
    }
  }
  _pakectData += data
  if (_pakectData.length < _packetLength) {
    return
  }
  if (_pakectData.length > _packetLength) {
    _pakectData = ""
    _packetLength = 0
    typeof _sendCallback == FUNCTION && _sendCallback(1, "接收数据超长")
    return
  }
  if (_pakectData.length == _packetLength) {
    if (_pakectArray.length == 0) {
      let ctl = parseInt(_pakectData.slice(2, 4), 16)
      _pakectCount = ctl - 0x80 + 1
      if (_pakectCount <= 0) {
        _pakectData = ""
        _packetLength = 0
        typeof _sendCallback == FUNCTION && _sendCallback(1, "CTL字段数据异常")
        return
      }
    }
    _pakectArray.push(_pakectData)
    _pakectData = ""
    _packetLength = 0

    if (_pakectArray.length == _pakectCount) {
      for (let i = 0; i < _pakectArray.length; i++) {
        let bcc = 0
        for (let j = 2; j < _pakectArray[i].length - 2; j += 2) {
          let bit = parseInt(_pakectArray[i].slice(j, j + 2), 16)
          bcc ^= bit
        }
        if (bcc != parseInt(_pakectArray[i].slice(-2), 16)) {
          typeof _sendCallback == FUNCTION && _sendCallback(1, "BCC校验失败")
          _pakectArray = new Array()
          _packetLength = 0
          return
        }
      }
      let completeData = ""
      for (let i = 0; i < _pakectArray.length; i++) {
        if (_pakectArray[i].length >= 10) {
          completeData += _pakectArray[i].slice(6, -2)
        }
      }
      _pakectArray = new Array()
      _packetLength = 0
      typeof _sendCallback == FUNCTION && _sendCallback(0, completeData)
    }
  }
}

/**
 * 握手指令
 */
var initDevice = function (callback) {
  sendData(ArtcDataUtil.makeC0SendData(), (code, data) => {
    if (code == 0) {
      if (data.startsWith("b000")) {
        typeof callback == FUNCTION && callback(0, data.slice(4))
      } else {
        typeof callback == FUNCTION && callback(1, data.slice(2, 4))
      }
    } else {
      typeof callback == FUNCTION && callback(1, data)
    }
  })
}


/**
 * 对 B-OBU 设备操作
 * instruction : 查看附录四，如：取设备序列号：02，取设备电量：03
 */
var deviceChannel = function (instruction, callback) {
  sendData(ArtcDataUtil.makeC5SendData(ArtcDataUtil.makeDBMTLV(instruction)), (code, data) => {
    if (code == 0) {
      if (data.startsWith("b500")) {
        let message = data.slice(16)
        if (instruction == "02") {
          let deviceNo = ""
          for (let i = 1; i < message.length; i += 2) {
            deviceNo = deviceNo + message.slice(i, i + 1)
          }
          typeof callback == FUNCTION && callback(0, deviceNo)
        } else if (instruction == "03") {
          let batv = parseInt(message, 16) + ""
          typeof callback == FUNCTION && callback(0, batv)
        } else if (instruction == "0b" || instruction == "0B") {
          typeof callback == FUNCTION && callback(0, parseInt(message, 16))
        } else {
          typeof callback == FUNCTION && callback(0, message)
        }
      } else {
        typeof callback == FUNCTION && callback(1, data.slice(2, 4))
      }
    } else {
      typeof callback == FUNCTION && callback(1, data)
    }
  })
}

/**
 * OBU apdu指令透传
 * type : 0 - IC卡， 1 - ESAM， 2-display（指令只支持单条，参考附录三，如闪前灯3次：8103000203），3-beeper（指令只支持单条，参考附录三，如蜂鸣3次：81020203）
 * apdu : apdu 指令数组
 */
var sendApdu = function (type, apdu, callback) {
  let tlv
  let dataType
  if (type == 0 || type == 1) {
    tlv = ArtcDataUtil.makeTLV(apdu)
    dataType = "01"
    if (type == 1) {
      dataType = "02"
    }
  } else if (type == 2 || type == 3) {
    tlv = ArtcDataUtil.makeDBMTLV(apdu[0])
    dataType = "03"
    if (type == 3) {
      dataType = "04"
    }
  } else {
    typeof callback == FUNCTION && callback(1, "参数错误")
    return
  }
  sendData(ArtcDataUtil.makeC2SendData(dataType, tlv), (code, data) => {
    if (code == 0) {
      if (type == 0 || type == 1) {
        let apdus = ArtcDataUtil.reTLV(data.slice(10))
        typeof callback == FUNCTION && callback(0, apdus)
      } else {
        if (data.startsWith("b200")) {
          typeof callback == FUNCTION && callback(0, data.slice(10))
        } else {
          typeof callback == FUNCTION && callback(1, data)
        }
      }
    } else {
      typeof callback == FUNCTION && callback(1, data)
    }
  })
}


/**
 * 发送apdu指令，
 * type : 0 - IC卡， 1 - ESAM， 2-display（指令只支持单条，参考附录三，如闪前灯3次：8103000203），3-beeper（指令只支持单条，参考附录三，如蜂鸣3次：81020203）
 * cosArr: 一条指令，指令拆分为数组["00","A4","00","00","02","3F","00"]
 */
var sendOneApdu = function (type, cosArr, callback) {
  let apdu = ""
  for (let i = 0; i < cosArr.length; i++) {
    apdu = apdu + cosArr[i]
  }
  sendApdu(type, [apdu], (code, data) => {
    if (code == 0) {
      typeof callback == FUNCTION && callback(0, data[0])
    }else {
      typeof callback == FUNCTION && callback(1, data)
    }
  })
}

/**
 * 获取设备编号
 */
var getObuNum = function (callback) {
  deviceChannel("02", (code, data) => {
    typeof callback == FUNCTION && callback(code, data)
  })
}

/**
 * 获取设备电量
 */
var getObuBattery = function (callback) {
  deviceChannel("03", (code, data) => {
    typeof callback == FUNCTION && callback(code, data)
  })
}

/**
 * 获取设备MAC
 */
var getObuMac = function (callback) {
  deviceChannel("0c", (code, data) => {
    typeof callback == FUNCTION && callback(code, data)
  })
}

/**
 * 获取设备版本
 */
var getObuVersion = function (callback) {
  deviceChannel("07", (code, data) => {
    typeof callback == FUNCTION && callback(code, data)
  })
}

/**
 * 获取设备ESAM合同号
 */
var getObuESAMNum = function (callback) {
  deviceChannel("09", (code, data) => {
    typeof callback == FUNCTION && callback(code, data)
  })
}

/**
 * 获取设备新防拆状态
 */
var getNewPipe = function (callback) {
  deviceChannel("0b", (code, data) => {
    typeof callback == FUNCTION && callback(code, data)
  })
}

/**
 * 更新新防拆状态
 */
var upNewPipe = function (state, callback) {
  deviceChannel("0a01" + ArtcDataUtil.num2hex(state, 1, true), (code, data) => {
    typeof callback == FUNCTION && callback(code, data)
  })
}

/**
 * 获取设备信息
 */
var getObuInfo = function (callback) {
  let obuNum
  let obuBattery
  let obuMac
  let obuVersion
  getObuNum((code, data) => {
    if (code == 0) {
      obuNum = data
      setTimeout(() => {
        getObuBattery((code, data) => {
          if (code == 0) {
            obuBattery = data + "%"
            setTimeout(() => {
              getObuMac((code, data) => {
                if (code == 0) {
                  obuMac = data
                  setTimeout(() => {
                    getObuVersion((code, data) => {
                      if (code == 0) {
                        obuVersion = data
                        callback(0, { obuId: obuNum, batlev: obuBattery, obuMac: obuMac, ver: obuVersion })
                      } else {
                        callback(1, "获取设备版本失败")
                      }
                    })
                  }, 100)
                } else {
                  callback(1, "获取设备obu MAC失败")
                }
              })
            }, 100)
          } else {
            callback(1, "获取设备电量失败")
          }
        })
      }, 100)
    } else {
      callback(1, "获取设备编号失败")
    }
  })
}

/**
 * 设置obu不休眠指令
 * time : 单位秒
 */
var obuSetSleepTime = function (time, callback) {
  sendData(ArtcDataUtil.makeCCSendData(time[0]), (code, data) => {
    if (code == 0) {
      if (data.startsWith("bc00")) {
        typeof callback == FUNCTION && callback(0, data)
      } else {
        typeof callback == FUNCTION && callback(1, data)
      }
    } else {
      typeof callback == FUNCTION && callback(1, data)
    }
  })
}

/**
 * 获取防拆状态
 * callback:code==0成功获取，data==0防拆弹起，data==1防拆按下
 */
var getActState = function (callback) {
  sendData(ArtcDataUtil.makeC4SendData("02"), (code, data) => {
    if (code == 0) {
      if (data.startsWith("b404")) {
        typeof callback == FUNCTION && callback(0, "获取防拆状态成功:未按下")
      } else if (data.startsWith("b405")) {
        typeof callback == FUNCTION && callback(0, "获取防拆状态成功:已按下")
      } else {
        typeof callback == FUNCTION && callback(1, data)
      }
    } else {
      typeof callback == FUNCTION && callback(1, data)
    }
  })
}

/**
 * 获取卡片信息
 */
var getCardInfo = function (callback) {
  let provider
  let cardType
  let cardVersion
  let cardId
  let signedDate
  let expiredDate
  let vehicleNumber
  let userType
  let plateColor
  let vehicleMode
  sendApdu(0, ["00A40000021001", "00B095002B"], (code, data) => {
    if (code == 0) {
      let cardInfo = data[1].slice(0, -4)
      provider = cardInfo.slice(0, 16)
      provider = gbk.gbk2hex(provider)
      cardType = cardInfo.slice(16, 18)
      switch (cardType) {
        case "16":
          cardType = "储值卡";
          break;
        case "17":
          cardType = "记账卡";
          break;
        default:
          cardType = "未知卡";
          break;
      }
      cardVersion = cardInfo.slice(18, 20)
      cardId = cardInfo.slice(20, 40)
      signedDate = cardInfo.slice(40, 48)
      expiredDate = cardInfo.slice(48, 56)
      vehicleNumber = cardInfo.slice(56, 80)
      vehicleNumber = gbk.gbk2hex(vehicleNumber)
      userType = cardInfo.slice(80, 82)
      switch (userType) {
        case "00":
          userType = "普通用户";
          break;
        case "06":
          userType = "工作车卡用户";
          break;
        default:
          cardType = "未知";
          break;
      }
      if (parseInt(cardVersion, 16) >= 0x40) {
        plateColor = cardInfo.slice(82, 84)
        vehicleMode = cardInfo.slice(84, 86)
      } else {
        plateColor = cardInfo.slice(82, 86)
        vehicleMode = " "
      }
      switch (plateColor) {
        case "00":
        case "0000":
          plateColor = "蓝色";
          break;
        case "01":
        case "0001":
          plateColor = "黄色";
          break;
        case "02":
        case "0002":
          plateColor = "黑色";
          break;
        case "03":
        case "0003":
          plateColor = "白色";
          break;
        default:
          plateColor = "未知";
          break;
      }
      switch (vehicleMode) {
        case "01":
          vehicleMode = "客一";
          break;
        case "02":
          vehicleMode = "客二";
          break;
        case "03":
          vehicleMode = "客三";
          break;
        case "04":
          vehicleMode = "客四";
          break;
        case "11":
          vehicleMode = "货一";
          break;
        case "12":
          vehicleMode = "货二";
          break;
        case "13":
          vehicleMode = "货三";
          break;
        case "14":
          vehicleMode = "货四";
          break;
        case "15":
          vehicleMode = "货五";
          break;
        default:
          vehicleMode = "未知";
          break;
      }
      typeof callback == FUNCTION && callback(0, { provider: provider, cardType: cardType, cardVersion: cardVersion, cardId: cardId, signedDate: signedDate, expiredDate: expiredDate, vehicleNumber: vehicleNumber, userType: userType, plateColor: plateColor, vehicleMode: vehicleMode })
    } else {
      typeof callback == FUNCTION && callback(code, data)
    }
  })
}

/**
 * 获取卡片余额
 */
var getCardBalance = function (callback) {
  sendApdu(0, ["00A40000021001", "805C000204"], (code, data) => {
    if (code == 0) {
      let loadMac1Info = data[1].slice(0, -4)
      typeof callback == FUNCTION && callback(0, loadMac1Info.slice(0, 8))
    } else {
      typeof callback == FUNCTION && callback(code, data)
    }
  })
}


/**
 * 圈存初始化
 */
var loadcardInit = function (credit, terminnalNo, pinCode, procType, keyIndex, callback) {
  let pinCos = "00200000" + ArtcDataUtil.num2hex(pinCode.length / 2, 1, true) + pinCode
  let macCos = "805000" + procType + "0B" + keyIndex + ArtcDataUtil.num2hex(credit, 4, true) + terminnalNo
  sendApdu(0, ["00A40000021001", pinCos, macCos], (code, data) => {
    if (code == 0) {
      let loadMac1Info = data[2].slice(0, -4)
      let balance = loadMac1Info.slice(0, 8)
      let trade_no = loadMac1Info.slice(8, 12)
      let rand = loadMac1Info.slice(16, 24)
      let mac1 = loadMac1Info.slice(24, 32)
      typeof callback == FUNCTION && callback(0, { balance: balance, serial: trade_no, icRandom: rand, mac1: mac1 })
    } else {
      typeof callback == FUNCTION && callback(code, data)
    }
  })
}

/**
 * 圈存
 */
var loadCard = function (mac2, callback) {
  if (mac2.length != 22) {
    callback(1, "mac2格式：14长度的时间+8长度的mac2")
    return
  }
  let mac2Cos = "805200000b" + mac2
  let tlv = ArtcDataUtil.makeTLV([mac2Cos], [true])
  sendApdu(0, [mac2Cos], (code, data) => {
    if (code == 0) {
      typeof callback == FUNCTION && callback(0, data[0].slice(0, -4))
    } else {
      typeof callback == FUNCTION && callback(code, data)
    }
  })
}


//接口对象
var ArtcBleUtil = {
  openBle: openBle,
  closeBle: closeBle,
  stopScan: stopScan,
  scanBle: scanBle,
  connectBle: connectBle,
  deployBle: deployBle,
  disconnectBle: disconnectBle,
  initDevice: initDevice,
  deviceChannel: deviceChannel,
  sendApdu: sendOneApdu,
  getObuNum: getObuNum,
  getObuBattery: getObuBattery,
  getObuVersion: getObuVersion,
  getObuESAMNum: getObuESAMNum,
  getObuMac: getObuMac,
  getNewPipe: getNewPipe,
  upNewPipe: upNewPipe,
  getObuInfo: getObuInfo,
  obuSetSleepTime: obuSetSleepTime,
  getActState: getActState,
  getCardInfo: getCardInfo,
  getCardBalance: getCardBalance,
  loadcardInit: loadcardInit,
  loadCard: loadCard,
}


//暴露接口对象
module.exports = ArtcBleUtil