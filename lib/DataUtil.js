/**
 * number(16进制数字)转换成指定字节数的（16进制字符串）hexString
 * num：转换的number值
 * bitNum：转换后的字节数
 * isBig：true-大端，fasle-小端
 */
var num2hex = function (num, bitNum, isBig) {
  //转大端hex并补足
  let hex = num.toString(16);
  for (let i = hex.length; i < bitNum * 2; i++) {
    hex = "0" + hex;
  }
  //多位截取
  if (hex.length > bitNum * 2) {
    hex = hex.substring(hex.length - bitNum * 2);
  }
  //转小端
  if (isBig == false) {
    let temp = "";
    for (let i = hex.length - 2; i >= 0; i -= 2) {
      temp = temp + hex.substring(i, i + 2);
    }
    hex = temp;
  }
  return hex;
}

/**
 * 将hexString转成bufferArray
 * bufferArray 分为一字节存储，并且存储的是十进制的数据
 */
var hex2buf = function (hexString) {
  let bufferArray = new Uint8Array(hexString.match(/[\da-f]{2}/gi).map(function (h) {
    return parseInt(h, 16)
  }))
  return bufferArray.buffer
}

/**
 * 将bufferArray转成hexString
 */
var buf2hex = function (bufferArray) {
  let hex = Array.prototype.map.call(new Uint8Array(bufferArray), x => ('00' + x.toString(16)).slice(-2)).join('')
  return hex
}

/**
 * TLV指令构造
 * tpdus:指令集合
 * needResponse:对于tpdu指令是否需要返回数据，true有返回，fasle没有返回，如：["00a40000023f00","00a40000021001"],[true,false],这前一条有返回3f00的信息和状态码，后一条则只返回状态码，没有信息
 */
var makeTLV = function (tpdus, needResponses) {
  let tlv = ""
  for (let i = 0; i < tpdus.length; i++) {
    let temp = "" + tpdus[i]
    let status = i + 1
    if (needResponses && needResponses[i] === false) {
      status = 0x80 + status
    }
    tlv = tlv + num2hex(status, 1, true) + num2hex(parseInt(temp.length / 2), 1, true) + temp;
  }
  let tlvLen = parseInt(tlv.length / 2);
  let tlvLenHex = tlvLen.toString(16);
  if (tlvLenHex.length % 2 != 0) {
    tlvLenHex = "0" + tlvLenHex;
  }
  if (tlvLen > 0x80) {
    tlvLenHex = (0x80 + parseInt(tlvLenHex.length / 2)).toString(16) + tlvLenHex;
  }
  return "80" + tlvLenHex + tlv;
}


/**
 * 构建display、beeper、厂商指令tlv
 */
var makeDBMTLV = function (instruction) {
  let hexLen = num2hex(parseInt(instruction.length / 2), 1, true);
  return "80" + hexLen + instruction;
}


/**
 * 分解TLV指令结构,返回tpdu指令数组
 */
var reTLV = function (tlv) {
  let tpdus = new Array();
  let lenc = parseInt(tlv.substring(2, 4), 16);
  let index = 4;
  if (lenc > 0x80) {
    index = index + (lenc - 0x80) * 2;
  }
  let count = 1;
  while (index < tlv.length) {
    let time = parseInt(tlv.substring(index, index + 2), 16);
    index += 2;
    let len = parseInt(tlv.substring(index, index + 2), 16);
    index += 2;
    let tpdu = tlv.substring(index, index + len * 2);
    tpdus.push(tpdu);
    index += len * 2;
  }
  if (tpdus.length == 0) {
    tpdus.push("FFFF");
  }
  return tpdus;
}

const frame_Len = 190
const send_Len = 40
const ST = "50"

var makeFrame = function (data) {
  let frameCount = parseInt(data.length / frame_Len)
  let frameBalance = data.length % frame_Len
  let frames = new Array()
  for (let i = 0; i < frameCount; i++) {
    frames.push(data.slice(i * frame_Len, (i + 1) * frame_Len))
  }
  if (frameBalance > 0) {
    frames.push(data.slice(- frameBalance))
  }
  //加厂商结构
  let manufacturerFrames = new Array();
  for (let i = 0; i < frames.length; i++) {
    let temp = frames[i]
    let CTL = ""
    if (i == 0) {
      CTL = num2hex(0x8000 + frames.length, 2, true)
    }
    else {
      CTL = num2hex(0x0000+i+1, 2, true)
    }
    let LEN = num2hex(parseInt(temp.length / 2), 1, true)
    let frame = ST + CTL + LEN + temp
    let bcc = 0
    for (let j = 1; j < parseInt(frame.length / 2); j++) {
      let bit = parseInt(frame.slice(j * 2, (j + 1) * 2), 16)
      bcc = bcc ^ bit
    }
    frame += num2hex(bcc, 1, true)
    manufacturerFrames.push(frame)
  }
  //分割发生小包
  let bufferArray = new Array()
  for (let i = 0; i < manufacturerFrames.length; i++) {
    let temp = manufacturerFrames[i]
    let bufferCount = parseInt(temp.length / send_Len)
    let bufferBalance = temp.length % send_Len
    for (let j = 0; j < bufferCount; j++) {
      let item = temp.slice(j * send_Len, (j + 1) * send_Len)
      bufferArray.push(hex2buf(item))
    }
    if (bufferBalance > 0) {
      let item = temp.slice(- bufferBalance)
      bufferArray.push(hex2buf(item))
    }
  }
  return bufferArray
}


/**
 * 初始化指令通道
 * APP通知OBU进行初始化，OBU返回主控程序版本、分包长度、设备状态等信息
 */
function make80SendData() {
  let data = "80"
  return makeFrame(data)
}

/**
 * 设备通道
 */
function make81SendData(tlv) {
  let data = "81"
  let len = num2hex(parseInt(tlv.length / 2), 2, false)
  data += len
  data += tlv
  return makeFrame(data)
}
/**
 * IC卡cos通道
 * dataType : bit0:数据类型，0明文，1密文。bit1-3：保留，都为0。bit4-7：目标索引：1用户卡，2ETC安全模块，3SE
 */
function make82SendData(dataType, tlv) {
  let data = "82"
  let len = num2hex(parseInt(tlv.length / 2), 2, false)
  data += dataType
  data += len
  data += tlv
  return makeFrame(data)
}


var DataUtil = {
  num2hex: num2hex,
  hex2buf: hex2buf,
  buf2hex: buf2hex,
  makeTLV: makeTLV,
  makeDBMTLV: makeDBMTLV,
  reTLV: reTLV,
  make80SendData: make80SendData,
  make81SendData: make81SendData,
  make82SendData: make82SendData,
}

module.exports = DataUtil








/**
 * 以下为自定义，暂不使用
 */


/**
 * 透传指令通道
 * 对 OBE-SAM、卡片等操作，具体包含:OBU二发，OBU激活，OBU数据查询，OBU延期，卡延期等业务操作
 * dataType : bit0~bit3：通道类型(1=ICC,2=ESAM,3=Display,4=Beeper,8=SE); bit4~bit6：保留置0; bit7：数据类型（0=明文，1=密文）。如：ICC明文输入"01",ICC密文输入"81",ESAM明文输入"02",ESAM密文输入:"82"
 * tlv : TLV格式（Beeper和Display的TLV格式不一样）
 */
function makeC2SendData(dataType, tlv) {
  let data = "85"
  let len = num2hex(parseInt(tlv.length / 2), 2, false)
  data += dataType
  data += len
  data += tlv
  return makeFrame(data)
}

/**
 * 升级指令通道
 * OBU主控程序升级
 * blockNum : 块号，0～254,255表示数据传输结束，后面不带内容和CRC检验字段
 * blockData : 升级内容，不足一块长度的数据用FF补足
 * checkSum : CRC校验和，生成多项式为X16+X12+X5+X1，初始值0xffff
 */
function makeC1SendData(blockNum, blockData, checkSum) {
  let data = "c1"
  data += num2hex(blockNum, 1, true)
  data += blockData
  data += checkSum
  return makeFrame(data)
}



/**
 * 数据下发指令通道
 * APP下发数据到OBU
 * dataType : "01" = 文本， "02" = 二进制
 */
function makeC3SendData(dataType, content) {
  let data = "c3"
  let len = num2hex(parseInt(content.length / 2), 2, false)
  data += dataType
  data += len
  data += content
  return makeFrame(data)
}

/**
 * 数据上报通道
 * 数据上报应答
 * status : "01" = 获取卡片状态， "02" = 获取防拆开关状态
 */
function makeC4SendData(status) {
  let data = "c4"
  data += status
  return makeFrame(data)
}

/**
 * 厂商指令通道
 * 厂商指令，如查询设备信息等
 * tlv : 指令数据，TLV格式
 */
function makeC5SendData(tlv) {
  let data = "8f"
  let len = num2hex(parseInt(tlv.length / 2), 2, false)
  data += len
  data += tlv
  return makeFrame(data)
}

/**
 * 链接保持指令通道
 * 通过该指令确保设备在指定时间内保持激活状态
 * times : 单位为秒
 */
function makeCCSendData(times) {
  let data = "cc"
  let hexTimes = num2hex(times, 1, true)
  data += hexTimes
  return makeFrame(data)
}

/**
 * 链路断开指令
 * APP发送该指令断开蓝牙连接
 */
function makeCDSendData() {
  let data = "cd"
  return makeFrame(data)
}

/**
 * 厂商验证通道
 * APP与设备验证通道
 * content : 指令数据：验签源数据（8byte的倍数）+8字节随机数R1+4字节MAC
 */
var makeCFSendData = function (content) {
  let data = "cf"
  let len = num2hex(parseInt(content.length / 2), 2, false)
  data += len
  data += content
  return makeFrame(data)
}