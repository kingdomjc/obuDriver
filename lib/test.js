const DataUtil = require("./DataUtil.js")
const BLEUtil = require("./BleUtil.js")


function testInit(){
  let array = DataUtil.make80SendData()
  console.log(DataUtil.buf2hex(array[0]))
}

function recvInit(){
  let data ="5080020f91001100c0303132333435363738399c"
  // 50是开头
  // 8002是一共2个包
  // 0f  是15
  // 数据：91001100c0303132333435363738399
        //type:91
        //status00
        //长度（小段）：0011
        //指令c0
  // cc:14
}
console.log(String.fromCharCode(65))

