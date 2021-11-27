// https://github.com/tobiasvl/awesome-chip-8
// deltatime https://stackoverflow.com/a/55028818
// https://tobiasvl.github.io/blog/write-a-chip-8-emulator/
// https://github.com/AfBu/haxe-chip-8-emulator/wiki/(Super)CHIP-8-Secrets
// https://multigesture.net/articles/how-to-write-an-emulator-chip-8-interpreter/
// https://spicyyoghurt.com/tutorials/html5-javascript-game-development/create-a-proper-game-loop-with-requestanimationframe


import instructions from "./Instructions";

export const emulator = {
    // todo slowdown cpu by awaiting a deltatime timeout that resolves a promise? i see other implementations do 10 instructions, wait and then another 10, because of timeout (in)precision
    deltaTime: 1,
    interval: null,
    paused: false,

    currentTick: {opcode: null, instruction: null, operands: null}, // for debugging

    log(data) {
        window.console.log(data);
    },

    init(canvas) {
        video.init(canvas.getContext('2d'));
        input.bindKeys();
    },

    loadRom(rom) {
        cpu.pc = 512;
        cpu.stackPointer = -1;
        cpu.i = 0;
        cpu.registers.fill(0);
        cpu.stack.fill(0);
        audio.delayTimer = 0;
        audio.soundTimer = 0;
        input.boundKeys = [];
        memory.fill(0);
        this.loadFonts();
        video.clearDisplay();

        let i = 512;
        rom.forEach(mem => {
            memory[i++] = mem;
        });
    },

    // see: http://devernay.free.fr/hacks/chip8/C8TECH10.HTM#2.4
    loadFonts() {
        // 0
        memory[0] = 0xF0;
        memory[1] = 0x90;
        memory[2] = 0x90;
        memory[3] = 0x90;
        memory[4] = 0xF0;
        // 1
        memory[5] = 0x20;
        memory[6] = 0x60;
        memory[7] = 0x20;
        memory[8] = 0x20;
        memory[9] = 0x70;
        // 2
        memory[10] = 0xF0;
        memory[11] = 0x10;
        memory[12] = 0xF0;
        memory[13] = 0x80;
        memory[14] =  0xF0;
        // 3
        memory[15] =  0xF0;
        memory[16] =  0x10;
        memory[17] =  0xF0;
        memory[18] =  0x10;
        memory[19] =  0xF0;
        // 4
        memory[20] =  0x90;
        memory[21] =  0x90;
        memory[22] =  0xF0;
        memory[23] =  0x10;
        memory[24] =  0x10;
        // 5
        memory[25] =  0xF0;
        memory[26] =  0x80;
        memory[27] =  0xF0;
        memory[28] =  0x10;
        memory[29] =  0xF0;
        // 6
        memory[30] =  0xF0;
        memory[31] =  0x80;
        memory[32] =  0xF0;
        memory[33] =  0x90;
        memory[34] =  0xF0;
        // 7
        memory[35] =  0xF0;
        memory[36] =  0x10;
        memory[37] =  0x20;
        memory[38] =  0x40;
        memory[39] =  0x40;
        // 8
        memory[40] =  0xF0;
        memory[41] =  0x90;
        memory[42] =  0xF0;
        memory[43] =  0x90;
        memory[44] =  0xF0;
        // 9
        memory[45] =  0xF0;
        memory[46] =  0x90;
        memory[47] =  0xF0;
        memory[48] =  0x10;
        memory[49] =  0xF0;
        // A
        memory[50] =  0xF0;
        memory[51] =  0x90;
        memory[52] =  0xF0;
        memory[53] =  0x90;
        memory[54] =  0x90;
        // B
        memory[55] =  0xE0;
        memory[56] =  0x90;
        memory[57] =  0xE0;
        memory[58] =  0x90;
        memory[59] =  0xE0;
        // C
        memory[60] =  0xF0;
        memory[61] =  0x80;
        memory[62] =  0x80;
        memory[63] =  0x80;
        memory[64] =  0xF0;
        // D
        memory[65] =  0xE0;
        memory[66] =  0x90;
        memory[67] =  0x90;
        memory[68] =  0x90;
        memory[69] =  0xE0;
        // E
        memory[70] =  0xF0;
        memory[71] =  0x80;
        memory[72] =  0xF0;
        memory[73] =  0x80;
        memory[74] =  0xF0;
        // F
        memory[75] =  0xF0;
        memory[76] =  0x80;
        memory[77] =  0xF0;
        memory[78] =  0x80;
        memory[79] =  0x80;
    },

    pause() {
        window.clearInterval(this.interval);
        this.interval = null;
    },

    start() {
        window.clearInterval(this.interval);
        this.interval = window.setInterval(() => {
            try {
                cpu.tick();
            } catch (e) {
                this.pause();
                console.log('Error', this.currentTick);
                throw e;
            }
        }, this.deltaTime);
    },
};

export const cpu = {
    // program counter. Points to memory address with the next instruction. 0x00 - 0x1FF is reserved
    pc: 512, // 0x200/512 = start of Chip-8 programs.

    // 'regular' registers V0 - VF
    registers: new Uint8Array(16).fill(0),

    // index register (points to memory addresses) (originally an unsigned 16bit int, will only use up to 12bits)
    i: 0,

    // 16 16bit values with return addresses to use after returning from a "subroutine". (more than 16 = stack overflow)
    stack: new Uint16Array(16),

    // referencing the stack index (0 - 15), stack[SP] will access the current return address in the stack (topmost level of the stack) (originally an unsigned 8bit integer)
    stackPointer: -1, // chip-8 uses 8bit int, 0xFF/11111111, when incremented, will point to stack index 0

    fetch() {
        if(this.pc >= memory.length) {
            throw new Error('Memory out of bounds');
        }
        const opcode = (memory[this.pc] << 8) | (memory[this.pc+1]);
        this.pc += 2; // increment 2 memory addresses
        return opcode
    },

    decode(opcode) {
        const instruction = instructions.find(instruction => {
            return (opcode & instruction.mask) === instruction.pattern;
        });

        if(!instruction) {
            console.warn('Instruction not yet implemented', opcode.toString(16), instruction);
            return {};
        }

        const operands = instruction.operands.map(op => {
            return (opcode & op.mask) >> op.shift;
        });

        return {instruction, operands}
    },

    tick() {
        const opcode = this.fetch();
        emulator.currentTick = {opcode: opcode, instruction: null, operands: null};

        if(!opcode) {
            emulator.pause();
            console.log('no opcode in memory');
            return;
        }

        const {instruction, operands} = this.decode(opcode);

        emulator.currentTick.instruction = instruction;
        emulator.currentTick.operands = operands;

        if(!instruction) {
            emulator.pause();
            return;
        }

        instruction.execute(operands);

        // this should actually happen at 60Hz
        audio.decrementTimers();
    },
};

// 12bit memory addresses (12bit max = 4095)
export const memory = new Uint8Array(4096);

// https://github.com/taniarascia/chip8/blob/9d2e713a8962add2ccf75cc4b99bd7a010c5b220/classes/interfaces/WebCpuInterface.js
export const video = {
    // 64 x 32 (2048 pixels) monochrome display (pixels are on or off only)

    fillStyle: '#00ff00',

    width: 64,
    height: 32,

    display: Array(32).fill(0).map(() => Array(64).fill(0)),

    /** @type CanvasRenderingContext2D */
    ctx: null,

    init(ctx) {
        this.ctx = ctx;
        this.setColor(this.fillStyle);
    },

    setColor(color) {
        this.ctx.fillStyle = color;
    },

    drawBg() {
        this.ctx.fillRect(0, 0, this.width, this.height);
    },

    drawPixel(x, y, value) {
        const collision = this.display[y][x] & value;
        const oldValue = this.display[y][x];
        this.display[y][x] = oldValue ^ value;

        if(this.display[y][x]) {
            this.ctx.fillRect(x, y, 1, 1);
        } else {
            this.ctx.clearRect(x, y, 1, 1);
        }

        return collision;
    },

    clearDisplay() {
        this.resetDisplay();
        this.ctx.clearRect(0, 0, this.width, this.height);
    },

    resetDisplay() {
        this.display = new Array(this.height);
        for(let y = 0; y < this.height; y++) {
            this.display[y] = new Array(this.width);
            for(let x = 0; x < this.width; x++) {
                this.display[y][x] = 0;
            }
        }
    }
};

export const audio = {
    // When one of the timers is set, it will decrement (by one) at 60Hz.
    // todo oscillator and timers

    // when non zero, play tone (1 freq only)
    soundTimer: 0,

    delayTimer: 0,

    decrementTimers() {
        if(this.soundTimer > 0) {
            this.soundTimer--;
        }
        if(this.delayTimer > 0) {
            this.delayTimer--;
        }
    }
};

export const input = {
    // mapping of qwerty keys to hex keypad
    keyMap: [
        {qwerty: '1', hex: 0x1},
        {qwerty: '2', hex: 0x2},
        {qwerty: '3', hex: 0x3},
        {qwerty: '4', hex: 0xC},
        {qwerty: 'q', hex: 0x4},
        {qwerty: 'w', hex: 0x5},
        {qwerty: 'e', hex: 0x6},
        {qwerty: 'r', hex: 0xD},
        {qwerty: 'a', hex: 0x7},
        {qwerty: 's', hex: 0x8},
        {qwerty: 'd', hex: 0x9},
        {qwerty: 'f', hex: 0xE},
        {qwerty: 'z', hex: 0xA},
        {qwerty: 'x', hex: 0x0},
        {qwerty: 'c', hex: 0xB},
        {qwerty: 'v', hex: 0xF},
    ],

    keysDown: [],

    boundKeys: [],

    bindKeys() {
        const onKeyDown = e => {
            const index = input.keysDown.findIndex(keymap => e.key === keymap?.qwerty);
            if(index === -1) {
                const mappedKey = input.keyMap.find(keymap => e.key === keymap?.qwerty);
                if(mappedKey) {
                    input.keysDown.push(mappedKey);
                }
            }
        };
        window.addEventListener('keydown', onKeyDown)

        const onKeyUp = e => {
            const index = input.keysDown.findIndex(keymap => e.key === keymap?.qwerty);
            if(index > -1) {
                input.keysDown.splice(index, 1);
            }
        };
        window.addEventListener('keyup', onKeyUp)
    },

    keyIsDown(key) {
        const qwertyKey = this.keyMap.find(keymap => key === keymap?.hex)?.qwerty;

        if(!this.boundKeys.includes(qwertyKey)) {
            this.boundKeys.push(qwertyKey);
        }

        return !!this.keysDown.find(keymap => key === keymap?.hex);
    },

    waitForKeyDown(register) {
        emulator.pause();
        console.log('Press any key');

        const eventCallback = key => {
            cpu.registers[register] = this.keyMap.find(keymap => key.key === keymap?.qwerty)?.hex;
            emulator.start();
            window.removeEventListener('keydown', eventCallback);
        };

        window.addEventListener('keydown', eventCallback);
    },
};

/*
nibble (e.g. register)
0000

8bit
00000000

12bit
000000000000

16bit
0000000000000000
*/
