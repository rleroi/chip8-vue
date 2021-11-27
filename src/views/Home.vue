<template>
    <div class="home">
        <div style="margin-bottom: 1rem; display: flex;">
            <div>
                <div class="canvas-wrapper" @click="showGrid = !showGrid">
                    <canvas width="64" height="32" ref="canvas"></canvas>
                    <div class="grid" v-if="showGrid">
                        <template v-for="y in 32">
                            <div v-for="x in 64" @mouseenter="gridX = x-1; gridY = y-1"></div>
                        </template>
                    </div>
                </div>
                <div style="text-align: center; width: 512px;">({{gridX}}, {{gridY}})</div>
            </div>
            <div style="margin-left: 1rem;">
                Key layout:
                <div style="font-family: monospace; font-size: 14pt; margin-bottom: 1rem;">
                    <div>
                        <span :class="{bound: input.boundKeys.includes('1')}">1</span>
                        <span :class="{bound: input.boundKeys.includes('2')}">2</span>
                        <span :class="{bound: input.boundKeys.includes('3')}">3</span>
                        <span :class="{bound: input.boundKeys.includes('4')}">4</span>
                    </div>
                    <div>
                        <span :class="{bound: input.boundKeys.includes('q')}">Q</span>
                        <span :class="{bound: input.boundKeys.includes('w')}">W</span>
                        <span :class="{bound: input.boundKeys.includes('e')}">E</span>
                        <span :class="{bound: input.boundKeys.includes('r')}">R</span>
                    </div>
                    <div>
                        <span :class="{bound: input.boundKeys.includes('a')}">A</span>
                        <span :class="{bound: input.boundKeys.includes('s')}">S</span>
                        <span :class="{bound: input.boundKeys.includes('d')}">D</span>
                        <span :class="{bound: input.boundKeys.includes('f')}">F</span>
                    </div>
                    <div>
                        <span :class="{bound: input.boundKeys.includes('z')}">Z</span>
                        <span :class="{bound: input.boundKeys.includes('x')}">X</span>
                        <span :class="{bound: input.boundKeys.includes('c')}">C</span>
                        <span :class="{bound: input.boundKeys.includes('v')}">V</span>
                    </div>
                </div>

                <div>
                    ROMs:
                    <div v-for="current in roms">{{current.name}} <button @click="rom=current.rom; loadRom()">Load</button></div>
                    <a target="_blank" href="https://github.com/corax89/chip8-test-rom">test rom instructions</a><br>
                    <a target="_blank" href="https://github.com/Skosulor/c8int/blob/master/test/chip8_test.txt">test rom 2 instructions</a><br>
                    <input type="file" @change="importRom" />
                </div>
            </div>
        </div>

        <div style="margin-bottom: 1rem;">
            <button @click="loadRom">Restart</button>
            <button @click="pause">Pause</button>
            <button @click="start">Continue</button>
            <button @click="skip">Skip</button>
            <button @click="jump">Jump</button>
            <input type="range" :min="0" :max="1000" v-model="emulator.deltaTime" />
            <span>delay: {{emulator.deltaTime}}</span>
        </div>

        <h2 @click="showDebug = !showDebug">Debug</h2>
        <div v-if="showDebug">
            <h3 @click="showCurrentTick = !showCurrentTick">CurrentTick</h3>
            <pre v-if="showCurrentTick && emulator.currentTick.instruction && emulator.currentTick.instruction.id">
                {{emulator.currentTick.instruction.id}},
                {{emulator.currentTick.operands.join(', ')}}
            </pre>

            <h3 @click="showBoundKeys = !showBoundKeys">BoundKeys</h3>
            <pre v-if="showBoundKeys">{{input.boundKeys}}</pre>

            <h3 @click="showKeysDown = !showKeysDown">KeysDown</h3>
            <pre v-if="showKeysDown">{{input.keysDown}}</pre>

            <h3 @click="showRom = !showRom">ROM</h3>
            <textarea v-if="showRom" style="width: 374px; height: 158px;" v-model="rom"></textarea>

            <h3 @click="showCpu = !showCpu">CPU</h3>
            <pre v-if="showCpu">{{cpu}}</pre>

            <h3 @click="showMemory = !showMemory">Memory</h3>
            <textarea v-if="showMemory">{{memory}}</textarea>
        </div>
    </div>
</template>

<script>
    // @ is an alias to /src
    import {emulator, video, cpu, memory, audio, input} from '@/chip8/Chip8.js'
    import {hexToBin, binToHex} from '@/chip8/Helpers.js'

    export default {
        name: 'Home',
        data() {
            return {
                roms: [
                    {
                        name: 'Connect 4',
                        rom: '121a434f4e4e454354342062792044617669642057494e544552a2bbf665a2b4f655690068016b006d0f6e1fa2a5600d61326200d02fd12f720f321e1234d021d1217201600aa29fd021d121a29fdde1fc0adde14c05127e3c04126a7bff7dfb3d0a127a6b066d2d127a3c0612987b017d053d32127a6b006d0fdde11250a2b4fb1ef06540fc12988a0070fbf0558983a29e3900a2a1dda4a29fdde1125060f0f0609090608080808080808080808080808080801a1a1a1a1a1a1a1a1a1a1a1a1a1a',
                        info: 'Q = left, E = right, W = drop coin.'
                    }, {
                        name: 'Breakout',
                        rom: '6e0565006b066a00a30cdab17a043a4012087b023b1212066c206d1fa310dcd122f660006100a312d0117008a30ed0116040f015f00730001234c60f671e680169ffa30ed671a310dcd16004e0a17cfe6006e0a17c02603f8c02dcd1a30ed67186848794603f8602611f8712471f12ac46006801463f68ff47006901d6713f0112aa471f12aa600580753f0012aa6001f018806061fc8012a30cd07160fe890322f6750122f6456012de124669ff806080c53f0112ca610280153f0112e080153f0112ee80153f0112e86020f018a30e7eff80e080046100d0113e00123012de78ff48fe68ff12ee7801480268016004f01869ff1270a314f533f265f12963376400d3457305f229d34500eef0008000fc00aa0000000000',
                    }, {
                        name: 'Space Invaders',
                        rom: '1225535041434520494e56414445525320302e39312042792044617669642057494e544552600061006208a3ddd0187108f21e3120122d700861003040122d69056c156e002391600af015f0073000124b23917e0112456600681c69006a046b0a6c046d3c6e0f00e023752351fd156004e09e127d2375380078ff23756006e09e128b23753839780123753600129f6005e09e12e96601651b8480a3d9d451a3d9d45175ff35ff12ad660012e9d4513f0112e9d45166008340730383b562f883226208330012c9237d8206430812d3331012d5237d8206331812dd237d8206432012e7332812e9237d3e0013077906491869006a046b0a6c047df46e0f00e023512375fd15126ff7073700126ffd1523518ba43b12131b7c026afc3b0213237c026a0423513c18126f00e0a4dd60146108620fd01f7008f21e302c133360fff015f00730001341f00a00e0a706fe651225a3c1f91e610823698106236981062369810623697bd000ee80e080123000dbc67b0c00eea3d9601cd80400ee23518e2323516005f018f015f0073000138900ee6a008de06b04e9a11257a60cfd1ef06530ff13af6a006b046d016e011397a50af01edbc67b087d017a013a07139700ee3c7effff99997effff2424e77eff3c3c7edb81423c7effdb10387cfe00007f003f007f0000000101010303030300003f20202020202020203f0808ff0000fe00fc00fe0000007e4242626262620000ff0000000000000000ff0000ff007d00417d057d7d0000c2c2c6446c28380000ff0000000000000000ff0000ff00f71014f7f7040400007c44fec2c2c2c20000ff0000000000000000ff0000ff00ef2028e8e82f2f0000f985c5c5c5c5f90000ff0000000000000000ff0000ff00be00203020bebe0000f704e7858584f40000ff0000000000000000ff0000ff00007f003f007f000000ef28ef00e0606f0000ff0000000000000000ff0000ff0000fe00fc00fe000000c000c0c0c0c0c00000fc0404040404040404fc1010fff981b98b9a9afa00fa8a9a9a9b99f8e62525f434343400171434373626c7df50505cd8d8df00df111f121b19d97c44fe868686fc84fe8282fefe80c0c0c0fefc82c2c2c2fcfe80f8c0c0fefe80f0c0c0c0fe80be8686fe8686fe8686861010101010101818184848789c90b0c0b09c8080c0c0c0feee9292868686fe82868686867c828686867cfe82fec0c0c07c82c2cac47afe86fe909c84fec0fe0202fefe10303030308282c2c2c2fe828282ee38108686969292ee8244383844828282fe303030fe021ef080fe0000000006060000006060c00000000000001818181800187cc60c1800180000fefe0000fe82868686fe080808181818fe02fec0c0fefe021e0606fe84c4c4fe0404fe80fe0606fec0c0c0fe82fefe02020606067c44fe8686fefe82fe06060644fe4444fe44a8a8a8a8a8a8a86c5a000c18a8304e7e001218666ca85a665424660048481812a80690a812007e3012a884304e721866a8a8a8a8a8a8905478a848786c72a812186c72665490a8722a18a8304e7e001218666ca87254a85a66187e184e72a8722a183066a8304e7e006c30544e9ca8a8a8a8a8a8a848547e18a890547866a86c2a305aa88430722aa8d8a8004e12a8e4a2a8004e12a86c2a545472a88430722aa8de9ca8722a18a80c54485a78721866a866185a5466726ca8722a0072a8722a18a8304e7e001218666ca8006618a8304e0c6618006c304e24a8722a183066a81e54660c189ca824545412a842780c3ca8aea8a8a8a8a8a8a8ff000000000000000000000000000000',
                    }, {
                        name: 'IBM Logo',
                        rom: '00e0a22a600c6108d01f7009a239d01fa2487008d01f7004a257d01f7008a266d01f7008a275d01f1228ff00ff003c003c003c003c00ff00ffff00ff0038003f003f003800ff00ff8000e000e00080008000e000e00080f800fc003e003f003b003900f800f8030007000f00bf00fb00f300e30043e000e0008000800080008000e000e0',
                    }, {
                        name: 'Random Number Test',
                        rom: '00e0c0ffa224f033f265f02960006300d035f1296005d035f229600ad035f00a1200',
                    }, {
                        name: 'Opcode Test',
                        rom: '124eeaacaaeaceaaaaaee0a0a0e0c04040e0e020c0e0e06020e0a0e0202060402040e080e0e0e0202020e0e0a0e0e0e020e040a0e0a0e0c080e0e080c080a040a0a0a202dab400eea202dab413dc680169056a0a6b01652a662ba216d8b4a23ed9b4a202362ba206dab46b06a21ad8b4a23ed9b4a206452aa202dab46b0ba21ed8b4a23ed9b4a2065560a202dab46b10a226d8b4a23ed9b4a20676ff462aa202dab46b15a22ed8b4a23ed9b4a2069560a202dab46b1aa232d8b4a23ed9b422426817691b6a206b01a20ad8b4a236d9b4a202dab46b06a22ad8b4a20ad9b4a2068750472aa202dab46b0ba22ad8b4a20ed9b4a206672a87b1472ba202dab46b10a22ad8b4a212d9b4a2066678671f87624718a202dab46b15a22ad8b4a216d9b4a2066678671f87634767a202dab46b1aa22ad8b4a21ad9b4a206668c678c87644718a202dab4682c69306a346b01a22ad8b4a21ed9b4a206668c6778876547eca202dab46b06a22ad8b4a222d9b4a20666e0866e46c0a202dab46b0ba22ad8b4a236d9b4a206660f86664607a202dab46b10a23ad8b4a21ed9b4a3e860006130f155a3e9f065a2064030a202dab46b15a23ad8b4a216d9b4a3e86689f633f265a2023001a2063103a2063207a206dab46b1aa20ed8b4a23ed9b4124813dc'
                    }, {
                        name: 'Opcode Test 2',
                        rom: '60fff015600069006e0060003001300013927e0160014001400013927e01610162005020501013927e01700270ff3f001392300215007e016bf08cb05cb013927e016a0f6bf08ab13aff13927e016a0f6bf18ab23a0113927e016a0f6bf18ab33afe13927e016aff6bf18ab43af013923f0113927e016f006aff6bf18ab53a0e13923f01139279016e006f006a048a063a0213003f0013926a058a063a0213003f0113927e016af06bc38ab73ad313923f0013926ac36bf08ab73a2d13923f0113927e016a048a0e3a0813923f0013926a848a0e3a0813923f0113927e016a006b009ab05ab013926a019ab013927e016004b2fc1392139213921392139213927e01ca0fcbf08ab23a001392caffcbff9ab013927e01fa074aff13927e016affa500fa33f2653002139231051392320513927e0160006101620263036404f45560ff61ff62ff63ff64fff46530001392340413927e0160fca550f055a5406010f01ef06530fc13926e0079013e001500390213926a196b10a388dab56a206b10a38ddab56f001386609090906090a0c0a09000e0f92965106419d4556f00fe2965106420d4556f0013a8030516273849516171e101151607ed173365185565191eeaebdded00e000ee9ea10a18290a'
                    }
                ],
                rom: '',

                showDebug: false,
                showRom: false,
                showKeysDown: false,
                showBoundKeys: false,
                showCurrentTick: true,
                showCpu: false,
                showMemory: false,
                showGrid: true,
                gridX: 0,
                gridY: 0,

                // debugging handles
                emulator, cpu, memory, audio, video, input,
            }
        },
        mounted() {
            emulator.init(this.$refs.canvas);
        },
        methods: {
            async importRom(event) {
                let file = new Uint8Array(await event.target.files?.[0]?.arrayBuffer());

                this.rom = binToHex(file);
                this.loadRom();
            },
            loadRom() {
                let rom = hexToBin(this.rom);
                emulator.loadRom(rom);

                emulator.start();
            },
            pause() {
                emulator.pause();
            },
            start() {
                emulator.start();
            },
            skip() {
                cpu.pc+=2;
            },
            jump() {
                cpu.tick();
            },
        }
    }
</script>
<style scoped lang="scss">
    .canvas-wrapper {
        position: relative;
        width: 512px;
        height: 256px;
    }

    .grid {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        display: grid;
        grid-template-columns: repeat(64, 1fr);
        grid-template-rows: repeat(32, 1fr);
        grid-gap: 0;

        div {
            border-left: 1px solid #222;
            border-top: 1px solid #222;
        }
    }

    canvas {
        background-color: #000;
        width: 512px;
        height: 256px;
        image-rendering: pixelated;
    }

    .bound {
        background-color: #000;
        color: #fff;
        border-radius: 3px;
    }
</style>
