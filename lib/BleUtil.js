const DataUtil = require("./DataUtil.js")
const gbk = require("./gbk.js")
const FUNCTION = "function"
const SERVICE_UUID = "0000FEE7-0000-1000-8000-00805F9B34FB"
const WRITE_UUID = "0000FFE1-0000-1000-8000-00805F9B34FB"
const READ_UUID = "0000FEC8-0000-1000-8000-00805F9B34FB"
const DEVICE_FLAG = ""

/**
 * 打开蓝牙适配器
 */
var openBle = function(callback) {
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
var closeBle = function(callback) {
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
var stopScan = function() {
  wx.stopBluetoothDevicesDiscovery({
    success: (res) => {},
  })
}


/**
 * 搜索蓝牙设备
 */
var scanBle = function(callback) {
  wx.onBluetoothDeviceFound((res) => {
    for (let i = 0; i < res.devices.length; i++) {
      if (!res.devices[i].name && !res.devices[i].localName) {
        continue
      }
      typeof callback == FUNCTION && callback(0,res.devices[i])
      return 
    }
    typeof callback == FUNCTION && callback(1)
  })
  wx.startBluetoothDevicesDiscovery({
    services: [SERVICE_UUID],
    allowDuplicatesKey: false,
    success: (res) => {},
    fail: () => {
      typeof callback == FUNCTION && callback(1)
    },
  })
}

/**
 * 连接设备
 */
var connectBle = function(device, callback) {
  let _bleDeviceId = device.deviceId
  stopScan()
  wx.onBLEConnectionStateChange((res) => {
    if (res.deviceId == _bleDeviceId) {
      if (res.connected == true) {
        console.log(res.deviceId)
        typeof callback == FUNCTION && callback(0)
      } else {
        console.log("连接断开")
      }
    }
  })
  wx.createBLEConnection({
    deviceId: _bleDeviceId,
    timeout: 10 * 1000,
    success: (res) => {},
    fail: (res) => {
      typeof callback == FUNCTION && callback(1,res)
    },
  })
}

/**
 * 配置连接外设
 */
var deployBle = function(_bleDeviceId, callback) {
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
                } else if (chr == WRITE_UUID) {
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
      let hexData = DataUtil.buf2hex(res.value)
      console.log("接收：" + hexData)
      analyticData(hexData)
    }
  })
}


/**
 * 断开蓝牙连接
 */
var disconnectBle = function(callback) {
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
var sendData = function(datas, bleDeviceId, callback) {
  _pakectData = ""
  _packetLength = 0
  _pakectArray = new Array()
  _pakectCount = 0
  _sendCallback = callback
  _sendDatas = datas
  _sendIndex = 0
  doSendData(bleDeviceId)
}


var doSendData = function(_bleDeviceId) {
  if (_sendIndex < _sendDatas.length) {
    let value = _sendDatas[_sendIndex]
    wx.writeBLECharacteristicValue({
      deviceId: _bleDeviceId,
      serviceId: SERVICE_UUID,
      characteristicId: WRITE_UUID,
      value: value,
      success: (res) => {
        console.log("发送：" + DataUtil.buf2hex(value))
        setTimeout(() => {
          _sendIndex++
          doSendData(_bleDeviceId)
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
var analyticData = function(data) {
  if (_pakectData.length == 0) {
    if (data.startsWith("50") && data.length >= 8) {
      _packetLength = parseInt(data.slice(6, 8), 16) * 2 + 10
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
    typeof _sendCallback == FUNCTION && _sendCallback(1, "接收数据过长")
    return
  }
  if (_pakectData.length == _packetLength) {
    if (_pakectArray.length == 0) {
      let ctl = parseInt(_pakectData.slice(2, 6), 16)
      _pakectCount = ctl - 0x8000
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
        for (let j = 0; j < _pakectArray[i].length - 2; j += 2) {
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
          completeData += _pakectArray[i].slice(8, -2)
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
 * 0为成功
 * 1为失败
 * 目前暂不提供错误原因
 */
var initDevice = function(bleDeviceId, callback) {
  sendData(DataUtil.make80SendData(), bleDeviceId, (code, data) => {
    if (code == 0) {
      if (data.startsWith("9000")) {
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
 * instruction : 取设备序列号：c0，
 *               取设备版本号：c1
 *                 取设备电量：c2
 *               强制设备断电：c3
 *                   设备复位：c4
 *              取设备蓝牙MAC：c5
 *              设置蓝牙时间：c6
 */
var deviceChannel = function(instruction, bleDeviceId, callback) {
  sendData(DataUtil.make81SendData(instruction), bleDeviceId,
    (code, data) => {
      if (code == 0) {
        if (data.startsWith("9100")) {
          let message = data.slice(8)
          if (instruction == "c0") {
            let deviceNo = ""
            for (let i = 2; i < message.length; i += 2) {
              deviceNo = deviceNo + message.slice(i, i + 2)
            }
            typeof callback == FUNCTION && callback(0, DataUtil.hex2Ascll(deviceNo))
          } else if (instruction == "c1") {
            let batv = "V" + parseInt(message.slice(2, 4), 16) +
              "." + parseInt(message.slice(4, 5), 16) +
              "." + parseInt(message.slice(5, 6), 16)
            typeof callback == FUNCTION && callback(0, batv)
          } else if (instruction == "c2") {
            typeof callback == FUNCTION && callback(0, parseInt(message.slice(2, 4), 16) + "%")
          } else if (instruction == "c3") {
            typeof callback == FUNCTION && callback(0, "stop ok")
          } else if (instruction == "c4") {
            typeof callback == FUNCTION && callback(0, "re-factory ok")
          } else if (instruction == "c5") {
            typeof callback == FUNCTION && callback(0, message.slice(2, 14))
          } else if (instruction.slice(0,2) == "c6") {
            typeof callback == FUNCTION && callback(0, "set ok")
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
 * OBU apdu指令透传,明文透传
 * type: 1.用户卡 2.Esam
 * apdu : apdu 指令数组
 */
var sendApdu = function(type, apdu, bleDeviceId, callback) {
  let tlv
  let dataType
  if (type == 1) {
    tlv = DataUtil.makeTLV(apdu)
    dataType = DataUtil.num2hex("10", 1, true)
  } else if (type == 2) {
    tlv = DataUtil.makeTLV(apdu)
    dataType = DataUtil.num2hex("20", 1, true)
  } else {
    typeof callback == FUNCTION && callback(1, "参数错误")
    return
  }
  sendData(DataUtil.make82SendData(dataType, tlv), bleDeviceId, (code, data) => {
    if (code == 0) {
      if (type == 1 || type == 2) {
        if (data.slice(2, 4) == "00") {
          let apdus = DataUtil.reTLV(data.slice(10))
          typeof callback == FUNCTION && callback(0, apdus)
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
 * type : 1 - IC卡， 2 - ESAM
 * cosArr: 一条指令，指令拆分为数组["00","A4","00","00","02","3F","00"]
 */
var sendOneApdu = function(type, cosArr, bleDeviceId, callback) {
  let apdu = ""
  for (let i = 0; i < cosArr.length; i++) {
    apdu = apdu + cosArr[i]
  }
  sendApdu(type, [apdu], bleDeviceId, (code, data) => {
    if (code == 0) {
      typeof callback == FUNCTION && callback(0, data[0])
    } else {
      typeof callback == FUNCTION && callback(1, data)
    }
  })
}

/**
 * 获取设备编号c0
 */
var getObuNum = function(deviceId, callback) {
  deviceChannel("c0", deviceId, (code, data) => {
    typeof callback == FUNCTION && callback(code, data)
  })
}

/**
 * 获取设备版本c1
 */
var getObuVersion = function(deviceId, callback) {
  deviceChannel("c1", deviceId, (code, data) => {
    typeof callback == FUNCTION && callback(code, data)
  })
}


/**
 * 获取设备电量c2
 */
var getObuBattery = function(deviceId, callback) {
  deviceChannel("c2", deviceId, (code, data) => {
    typeof callback == FUNCTION && callback(code, data)
  })
}

/**
 * 设备断电c3
 */
var setDeviceStop = function(deviceId) {
  deviceChannel("c3", deviceId, (code, data) => {
    typeof callback == FUNCTION && callback(code, data)
  })
}

/**
 * 设备恢复出厂设置c4
 */
var setReFactory = function(deviceId, callback) {
  deviceChannel("c4", deviceId, (code, data) => {
    typeof callback == FUNCTION && callback(code, data)
  })
}

/**
 * 获取设备MACc5
 */
var getObuMac = function(deviceId, callback) {
  deviceChannel("c5", deviceId, (code, data) => {
    typeof callback == FUNCTION && callback(code, data)
  })
}


/**
 * 获取设备ESAM合同号
 */
var getObuESAMNum = function(deviceId, callback) {
  deviceChannel("09", deviceId, (code, data) => {
    typeof callback == FUNCTION && callback(code, data)
  })
}

/**
 * 获取设备新防拆状态
 */
var getNewPipe = function(deviceId, callback) {
  deviceChannel("0b", deviceId, (code, data) => {
    typeof callback == FUNCTION && callback(code, data)
  })
}

/**
 * 更新新防拆状态
 */
var upNewPipe = function(state, deviceId, callback) {
  deviceChannel("0a01" + DataUtil.num2hex(state, 1, true), deviceId, (code, data) => {
    typeof callback == FUNCTION && callback(code, data)
  })
}

/**
 * 获取设备信息
 */
var getObuInfo = function(deviceId, callback) {
  let obuNum
  let obuBattery
  let obuMac
  let obuVersion
  getObuNum(deviceId, (code, data) => {
    if (code == 0) {
      obuNum = data
      setTimeout(() => {
        getObuBattery(deviceId, (code, data) => {
          if (code == 0) {
            obuBattery = data
            setTimeout(() => {
              getObuMac(deviceId, (code, data) => {
                if (code == 0) {
                  obuMac = data
                  setTimeout(() => {
                    getObuVersion(deviceId, (code, data) => {
                      if (code == 0) {
                        obuVersion = data
                        callback(0, {
                          obuId: obuNum,
                          batlev: obuBattery,
                          obuMac: obuMac,
                          ver: obuVersion
                        })
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
var obuSetSleepTime = function(time, deviceId, callback) {
  deviceChannel("c6"+time, deviceId, (code, data) => {
    typeof callback == FUNCTION && callback(code, data)
  })
}

/**
 * 获取防拆状态
 * callback:code==0成功获取，data==0防拆弹起，data==1防拆按下
 */
var getActState = function(callback) {
  sendData(DataUtil.makeC4SendData("02"), (code, data) => {
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

/*---------------------------------------------------------操作ic卡--------------------------------------------------------------- */

/**
 * 获取0016,8位随机数
 */
var get0016Info = function(bleDeviceId, callback) {
  let cardholderID=""              //持卡人身份标识
  let staffID=""                  //本系统职工标识
  let cardholderName=""          //持卡人姓名
  let cardNumber=""                 //持卡人证件号码
  let cardType=""                //持卡人证件类型
  let random=""                   //随机数
  let cardId=""                   //卡片id
  sendApdu(1, ["00A40000023f00", "00B0960037", "00A40000021001", "00B095002b", "00A40000023f00","0084000004"], bleDeviceId, (code, data) => {
    if (code == 0 && data[1].slice(-4) == "9000" && data[2].slice(-4) == '9000') {
        random = data[5].slice(0,-4)
        cardholderID = data[1].slice(0, 2)
        staffID = data[1].slice(2, 4)
        cardholderName = data[1].slice(4, 44)
        cardNumber = data[1].slice(44, 108)
        cardType = data[1].slice(108, 110)
        cardId = data[3].slice(20, 40)
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
      typeof callback == FUNCTION && callback(0, {
        cardholderID: cardholderID,
        staffID: staffID,
        cardholderName: cardholderName,
        cardNumber: cardNumber,
        cardType: cardType,
        random: random,
        cardId: cardId
      })
    } else {
      typeof callback == FUNCTION && callback(code, data)
    }
  })
}

/**
 * 0016写入基本信息
 */
var set0016Info = function(cardInfo, bleDeviceId, callback) {
  sendApdu(1, [cardInfo], bleDeviceId, (code,data)=>{
    console.log(data)
    if(code==0&&data[0].slice(-4)=="9000"){
        callback(0,data)
    }else{
      callback(1,data)
    }
  })
}


/**
 * 获取0015,8位随机数
 */
var get0015Info = function (bleDeviceId, callback) {
  let provider=""    //发卡方标识
  let cardType=""    //卡片类型
  let cardVersion = "" //卡片版本号
  let cardId = ""         //卡片id
  let signedDate = ""      //启用时间
  let expiredDate = ""       //到期时间
  let vehicleNumber = ""      //车牌号码
  let userType = ""            //用户类型
  let plateColor=""           //车辆颜色
  let vehicleMode=""          //车辆类型
  let random=""               //随机数
  sendApdu(1, ["00A40000021001", "00B095002b", "0084000004"], bleDeviceId, (code, data) => {
    if (code == 0 && data[1].slice(-4) == "9000" && data[2].slice(-4) == '9000') {
       random = data[2].slice(0, -4)
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
      typeof callback == FUNCTION && callback(0, {
        provider: provider,
        cardType: cardType,
        cardVersion: cardVersion,
        cardId: cardId,
        signedDate: signedDate,
        expiredDate: expiredDate,
        vehicleNumber: vehicleNumber,
        userType: userType,
        plateColor: plateColor,
        vehicleMode: vehicleMode,
        random:random
      })
    } else {
      typeof callback == FUNCTION && callback(code, data)
    }
  })
}

/**
 * 0015写入信息
 */
var set0015Info = function (cardInfo, bleDeviceId, callback) {
  sendApdu(1, [cardInfo], bleDeviceId, (code, data) => {
    console.log(data)
    if (code == 0 && data[0].slice(-4) == "9000") {
      callback(0, data)
    } else {
      callback(1, data)
    }
  })
}

/**
 * 获取卡片余额
 */
var getCardBalance = function (bleDeviceId,callback) {
  sendApdu(1, ["00A40000021001", "805C000204"], bleDeviceId, (code, data) => {
    if (code == 0 && data[1].slice(-4)=="9000") {
      let loadMac1Info = data[1].slice(0, -4)
      typeof callback == FUNCTION && callback(0, loadMac1Info.slice(0, 8))
    } else {
      typeof callback == FUNCTION && callback(code, data)
    }
  })
}


/**
 * 圈存初始化
 * credit :金额
 * terminnalNo：机器号码
 * pinCode：密钥索引号
 * procType:交易类型标识
 * keyIndex:
 * 
 * 流程：1.检查IC卡是否支持命令中包含的密钥索引号
 *      2.IC卡生成一个伪随机数ICC，过程密钥SESLK和一个报文鉴别码MAC1
 */
var loadCardInit = function (credit, terminnalNo, pinCode, procType, keyIndex, bleDeviceId, callback) {
  let pinCos = "00200000" + DataUtil.num2hex(pinCode.length / 2, 1, true) + pinCode
  let macCos = "805000" + procType + "0B" + keyIndex + DataUtil.num2hex(credit, 4, true) + terminnalNo
  sendApdu(1, ["00A40000020001", pinCos, macCos], bleDeviceId, (code, data) => {
    if (code == 0) {
      let loadMac1Info = data[2].slice(0, -4)
      let balance = loadMac1Info.slice(0, 8)
      let trade_no = loadMac1Info.slice(8, 12)
      let rand = loadMac1Info.slice(16, 24)
      let mac1 = loadMac1Info.slice(24, 32)
      typeof callback == FUNCTION && callback(0, {
        balance: balance,
        serial: trade_no,
        icRandom: rand,
        mac1: mac1
      })
    } else {
      typeof callback == FUNCTION && callback(code, data)
    }
  })
}

/**
 * 圈存
 */
var loadCard = function (command, bleDeviceId, callback) {
  if (command.length != 22) {
    callback(1, "mac2格式：14长度的时间+8长度的mac2")
    return
  }
  sendApdu(1, [command], bleDeviceId,(code, data) => {
    console.log(data)
    if (code == 0 && data[1].slice(-4) == "9000") {
      typeof callback == FUNCTION && callback(0, data[0].slice(0, -4))
    } else {
      typeof callback == FUNCTION && callback(code, data)
    }
  })
}
/**
 * 获取写车辆信息参数
 */
var getVehiclePara = function (bleDeviceId, callback){
  let random = ""               //随机数
  let contractId=""             //合同序列号
  let cardId=""                 //卡号
  sendApdu(1, ["00A40000021001", "00B095002b"], bleDeviceId, (code, data1) => {
    if (code == 0 && data1[1].slice(-4) == "9000") {
      cardId = data1[1].slice(20, 40)
      sendApdu(2, ["00A4000002DF01", "00B0810B08", "0084000004"], bleDeviceId, (code, data) => {
        console.log(data)
        if (code == 0 && data[2].slice(-4) == "9000") {
          random = data[2].slice(0, -4)
          contractId = data[1].slice(0, -4)
          callback(0, {
            random: random,
            contractId: contractId,
            cardId: cardId
          })
        } else {
          callback(1, data)
        }
      })
    }else{
      callback(1,data)
    }
  })
  
}

/**
 * 写车辆信息文件
 */
var writeVehicle = function (commandVeh,bleDeviceId,callback){
  sendApdu(2, [commandVeh], bleDeviceId, (code, data) => {
    console.log(data)
    if (code == 0 && data[0].slice(-4) == "9000") {
      callback(0, data)
    } else {
      callback(1, data)
    }
  })
}

/**
 * 获取写系统信息参数
 */
var getSysPara = function (bleDeviceId, callback){
  let random=""        //随机数
  let distributorID=""  //发行方标识
  let contractType=""        //合同类型
  let contractVer=""        //合同版本
  let contractId = ""       //合同序列号
  let signedDate = ""      //启用时间
  let expiredDate = ""       //到期时间
  let disStatus=""          //拆卸状态
  sendApdu(2, ["00A40000023F00", "00B081001B","0084000004"], bleDeviceId, (code, data) => {
    if (code == 0 && data[2].slice(-4) == "9000") {
      random = data[2].slice(0, -4)
      let info = data[1].slice(0, -4)
      distributorID=info.slice(0,16)
      contractType=info.slice(16,18)
      contractVer=info.slice(18,20)
      contractId=info.slice(20,36)
      signedDate=info.slice(36,44)
      expiredDate=info.slice(44,52)
      disStatus=info.slice(52,54)
      callback(0, {
        random: random,
        sysInfo:info,
        // distributorID: distributorID,
        // contractType: contractType,
        // contractVer: contractVer,
        // contractId: contractId,
        // signedDate: signedDate,
        // expiredDate: expiredDate,
        // disStatus: disStatus,
        // contractId: contractId
      })
    } else {
      callback(1, data)
    }
  })
}

/**
 * 写系统信息文件
 */
var writeSys = function (commandSys, bleDeviceId, callback) {
  sendApdu(2, [commandSys], bleDeviceId, (code, data) => {
    console.log(data)
    if (code == 0 && data[0].slice(-4) == "9000") {
      callback(0, data)
    } else {
      callback(1, data)
    }
  })
 }

//接口对象
var BleUtil = {
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
  get0016Info: get0016Info,
  set0016Info: set0016Info,
  set0015Info: set0015Info,
  get0015Info: get0015Info,
  getCardBalance: getCardBalance,
  loadCardInit: loadCardInit,
  loadCard: loadCard,
  getVehiclePara: getVehiclePara,
  writeVehicle: writeVehicle,
  getSysPara: getSysPara,
  writeSys: writeSys,
}


//暴露接口对象
module.exports = BleUtil