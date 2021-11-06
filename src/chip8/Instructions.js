
import {cpu, memory, audio, video, input, emulator} from './Chip8';

// CPU instructions http://devernay.free.fr/hacks/chip8/C8TECH10.HTM#3.1
// https://github.com/mattmikolay/chip-8/wiki/CHIP%E2%80%908-Instruction-Set
// https://multigesture.net/articles/how-to-write-an-emulator-chip-8-interpreter/
// https://github.com/taniarascia/chip8/blob/9d2e713a8962add2ccf75cc4b99bd7a010c5b220/classes/CPU.js
export default [
    {
        id: 'SYS_ADDR',
        name: 'SYS',
        mask: 0xf000, // instruction mask
        pattern: 0xf000, // instruction pattern
        operands: [
            {
                mask: 0x0FFF,
                shift: 0,
            }
        ],
        execute(operands) {
            /*
             0nnn - SYS addr
             Jump to a machine code routine at nnn.

             This instruction is only used on the old computers on which Chip-8 was originally implemented. It is ignored by modern interpreters.
             */
        }
    },
    {
        id: 'CLS',
        name: 'CLS',
        mask: 0xffff, // instruction mask
        pattern: 0x00E0, // instruction pattern
        operands: [],
        execute(operands) {
            video.clearDisplay();
        }
    },
    {
        id: 'RET',
        name: 'RET',
        mask: 0xffff, // instruction mask
        pattern: 0x00EE, // instruction pattern
        operands: [],
        execute(operands) {
            /*
            00EE - RET
            Return from a subroutine.

            The interpreter sets the program counter to the address at the top of the stack, then subtracts 1 from the stack pointer.
            */

            if (cpu.stackPointer === -1) {
                throw new Error('Stack underflow.')
            }

            cpu.pc = cpu.stack[cpu.stackPointer];
            cpu.stackPointer--;
        }
    },
    {
        id: 'JP_ADDR',
        name: 'JP',
        mask: 0xf000, // instruction mask
        pattern: 0x1000, // instruction pattern
        operands: [
            {
                mask: 0x0fff, // operand mask
                shift: 0,
            },
        ],
        execute(operands) {
            let [nnn] = operands;
            cpu.pc = nnn;
        }
    },
    {
        id: 'CALL_ADDR',
        name: 'CALL',
        mask: 0xf000, // instruction mask
        pattern: 0x2000, // instruction pattern
        operands: [
            {
                mask: 0x0fff, // operand mask
                shift: 0,
            },
        ],
        execute(operands) {
            let [nnn] = operands;

            /*
            2nnn - CALL addr
            Call subroutine at nnn.

            The interpreter increments the stack pointer, then puts the current PC on the top of the stack. The PC is then set to nnn.
            */

            if (cpu.stackPointer === 15) {
                throw new Error('Stack overflow.')
            }

            cpu.stackPointer++;
            cpu.stack[cpu.stackPointer] = cpu.pc;

            cpu.pc = nnn;
        }
    },
    {
        id: 'SE_VX_BYTE',
        name: 'SE',
        mask: 0xf000, // instruction mask
        pattern: 0x3000, // instruction pattern
        operands: [
            {
                mask: 0x0f00, // operand mask
                shift: 8,  // shift 8 bits right (2 nibbles) to get the value
            }, {
                mask: 0x00ff, // operand mask
                shift: 0,
            },
        ],
        execute(operands) {
            let [x, kk] = operands;

            if(cpu.registers[x] === kk) {
                cpu.pc += 2;
            }
        }
    },
    {
        id: 'SNE_VX_BYTE',
        name: 'SNE',
        mask: 0xf000, // instruction mask
        pattern: 0x4000, // instruction pattern
        operands: [
            {
                mask: 0x0f00, // operand mask
                shift: 8,  // shift 8 bits right (2 nibbles) to get the value
            }, {
                mask: 0x00ff, // operand mask
                shift: 0,
            },
        ],
        execute(operands) {
            let [x, kk] = operands;

            if(cpu.registers[x] !== kk) {
                cpu.pc += 2;
            }
        }
    },
    {
        id: 'SE_VX_VY',
        name: 'SE',
        mask: 0xf00f, // instruction mask
        pattern: 0x5000, // instruction pattern
        operands: [
            {
                mask: 0x0f00, // operand mask
                shift: 8,  // shift 8 bits right (2 nibbles) to get the value
            }, {
                mask: 0x00f0, // operand mask
                shift: 4,
            },
        ],
        execute(operands) {
            let [x, y] = operands;

            if(cpu.registers[x] === cpu.registers[y]) {
                cpu.pc += 2;
            }
        }
    },
    {
        id: 'LD_VX_BYTE',
        name: 'LD',
        mask: 0xf000, // instruction mask
        pattern: 0x6000, // instruction pattern
        operands: [
            {
                mask: 0x0f00, // operand mask
                shift: 8,  // shift 8 bits right (2 nibbles) to get the value
            }, {
                mask: 0x00ff, // operand mask
                shift: 0,
            },
        ],
        execute(operands) {
            let [x, kk] = operands;

            cpu.registers[x] = kk;
        }
    },
    {
        id: 'ADD_VX_BYTE',
        name: 'ADD',
        mask: 0xf000, // instruction mask
        pattern: 0x7000, // instruction pattern
        operands: [
            {
                mask: 0x0f00, // operand mask
                shift: 8,  // shift 8 bits right (2 nibbles) to get the value
            }, {
                mask: 0x00ff, // operand mask
                shift: 0,
            },
        ],
        execute(operands) {
            let [x, kk] = operands;

            cpu.registers[x] += kk;
        }
    },
    {
        id: 'LD_VX_VY',
        name: 'LD',
        mask: 0xf00f, // instruction mask
        pattern: 0x8000, // instruction pattern
        operands: [
            {
                mask: 0x0f00, // operand mask
                shift: 8,  // shift 8 bits right (2 nibbles) to get the value
            }, {
                mask: 0x00f0, // operand mask
                shift: 4,
            },
        ],
        execute(operands) {
            let [x, y] = operands;

            cpu.registers[x] = cpu.registers[y];
        }
    },
    {
        id: 'OR_VX_VY',
        name: 'OR',
        mask: 0xf00f, // instruction mask
        pattern: 0x8001, // instruction pattern
        operands: [
            {
                mask: 0x0f00, // operand mask
                shift: 8,  // shift 8 bits right (2 nibbles) to get the value
            }, {
                mask: 0x00f0, // operand mask
                shift: 4,
            },
        ],
        execute(operands) {
            let [x, y] = operands;

            cpu.registers[x] = cpu.registers[x] | cpu.registers[y];
        }
    },
    {
        id: 'AND_VX_VY',
        name: 'AND',
        mask: 0xf00f, // instruction mask
        pattern: 0x8002, // instruction pattern
        operands: [
            {
                mask: 0x0f00, // operand mask
                shift: 8,  // shift 8 bits right (2 nibbles) to get the value
            }, {
                mask: 0x00f0, // operand mask
                shift: 4,
            },
        ],
        execute(operands) {
            let [x, y] = operands;

            cpu.registers[x] = cpu.registers[x] & cpu.registers[y];
        }
    },
    {
        id: 'XOR_VX_VY',
        name: 'XOR',
        mask: 0xf00f, // instruction mask
        pattern: 0x8003, // instruction pattern
        operands: [
            {
                mask: 0x0f00, // operand mask
                shift: 8,  // shift 8 bits right (2 nibbles) to get the value
            }, {
                mask: 0x00f0, // operand mask
                shift: 4,
            },
        ],
        execute(operands) {
            let [x, y] = operands;

            cpu.registers[x] = cpu.registers[x] ^ cpu.registers[y];
        }
    },
    {
        id: 'ADD_VX_VY',
        name: 'ADD',
        mask: 0xf00f, // instruction mask
        pattern: 0x8004, // instruction pattern
        operands: [
            {
                mask: 0x0f00, // operand mask
                shift: 8,  // shift 8 bits right (2 nibbles) to get the value
            }, {
                mask: 0x00f0, // operand mask
                shift: 4,
            },
        ],
        execute(operands) {
            let [x, y] = operands;
            if((cpu.registers[x] + cpu.registers[y]) > 255) {
                cpu.registers[15] = 1;
            } else {
                cpu.registers[15] = 0;
            }

            cpu.registers[x] += cpu.registers[y];
        }
    },
    {
        id: 'SUB_VX_VY',
        name: 'SUB',
        mask: 0xf00f, // instruction mask
        pattern: 0x8005, // instruction pattern
        operands: [
            {
                mask: 0x0f00, // operand mask
                shift: 8,  // shift 8 bits right (2 nibbles) to get the value
            }, {
                mask: 0x00f0, // operand mask
                shift: 4,
            },
        ],
        execute(operands) {
            let [x, y] = operands;
            if(cpu.registers[x] > cpu.registers[y]) {
                cpu.registers[15] = 1;
            } else {
                cpu.registers[15] = 0;
            }

            cpu.registers[x] -= cpu.registers[y];
        }
    },
    {
        id: 'SHR_VX_VY',
        name: 'SHR',
        mask: 0xf00f, // instruction mask
        pattern: 0x8006, // instruction pattern
        operands: [
            {
                mask: 0x0f00, // operand mask
                shift: 8,  // shift 8 bits right (2 nibbles) to get the value
            }, {
                mask: 0x00f0, // operand mask
                shift: 4,
            },
        ],
        execute(operands) {
            let [x, y] = operands;

            // if the least significant bit is 1, set the carry flag
            cpu.registers[0xF] = cpu.registers[x] & 0x1;

            cpu.registers[x] /= 2;
        }
    },
    {
        id: 'SUBN_VX_VY',
        name: 'SUBN',
        mask: 0xf00f, // instruction mask
        pattern: 0x8007, // instruction pattern
        operands: [
            {
                mask: 0x0f00, // operand mask
                shift: 8,  // shift 8 bits right (2 nibbles) to get the value
            }, {
                mask: 0x00f0, // operand mask
                shift: 4,
            },
        ],
        execute(operands) {
            let [x, y] = operands;

            // if Vy > Vx, set VF to 1
            cpu.registers[0xF] = cpu.registers[y] > cpu.registers[x];

            cpu.registers[x] = cpu.registers[y] - cpu.registers[x];
        }
    },
    {
        id: 'SHL_VX_VY',
        name: 'SHL',
        mask: 0xf00f, // instruction mask
        pattern: 0x800E, // instruction pattern
        operands: [
            {
                mask: 0x0f00, // operand mask
                shift: 8,  // shift 8 bits right (2 nibbles) to get the value
            }, {
                mask: 0x00f0, // operand mask
                shift: 4,
            },
        ],
        execute(operands) {
            let [x, y] = operands;

            // if most significant bit is 1, set the carry flag
            cpu.registers[0xF] = cpu.registers[x] & 0x80;

            cpu.registers[x] *= 2;
        }
    },
    {
        id: 'SNE_VX_VY',
        name: 'SNE',
        mask: 0xf00f, // instruction mask
        pattern: 0x9000, // instruction pattern
        operands: [
            {
                mask: 0x0f00, // operand mask
                shift: 8,  // shift 8 bits right (2 nibbles) to get the value
            }, {
                mask: 0x00f0, // operand mask
                shift: 4,
            },
        ],
        execute(operands) {
            let [x, y] = operands;

            if(cpu.registers[x] !== cpu.registers[y]) {
                cpu.pc += 2;
            }
        }
    },
    {
        id: 'LD_I_ADDR',
        name: 'LD',
        mask: 0xf000, // instruction mask
        pattern: 0xA000, // instruction pattern
        operands: [
            {
                mask: 0x0fff,
                shift: 0,
            },
        ],
        execute(operands) {
            let [nnn] = operands;

            cpu.i = nnn;
        }
    },
    {
        id: 'JP_V0_ADDR',
        name: 'JP',
        mask: 0xf000, // instruction mask
        pattern: 0xB000, // instruction pattern
        operands: [
            {
                mask: 0x0fff,
                shift: 0,
            },
        ],
        execute(operands) {
            let [nnn] = operands;

            cpu.pc = cpu.registers[0] + nnn;
        }
    },
    {
        id: 'RND_VX_BYTE',
        name: 'RND',
        mask: 0xf000, // instruction mask
        pattern: 0xC000, // instruction pattern
        operands: [
            {
                mask: 0x0f00, // operand mask
                shift: 8,  // shift 8 bits right (2 nibbles) to get the value
            }, {
                mask: 0x00ff, // operand mask
                shift: 0,
            },
        ],
        execute(operands) {
            let [x, kk] = operands;

            cpu.registers[x] = Math.floor(Math.random() * 256) & kk;
        }
    },
    {
        id: 'DRAW_VX_VY_NIBBLE',
        name: 'DRAW',
        mask: 0xf000, // instruction mask
        pattern: 0xD000, // instruction pattern
        operands: [
            {
                mask: 0x0f00, // operand mask
                shift: 8,  // shift 8 bits right (2 nibbles) to get the value
            }, {
                mask: 0x00f0,
                shift: 4,
            }, {
                mask: 0x000f,
                shift: 0,
            },
        ],
        execute(operands) {
            let [x, y, n] = operands;

            // If no pixels are erased, set VF to 0
            cpu.registers[15] = 0;

            const startX = cpu.registers[x]// % 64;
            const startY = cpu.registers[y]// % 32;

            // The interpreter reads n bytes from memory, starting at the address stored in cpu.i
            for(let rowI = 0; rowI < n; rowI++) {
                const spriteRow = memory[cpu.i + rowI];
                const drawY = (startY + rowI) % 32;

                // Each row has eight pixels
                for(let colI = 0; colI < 8; colI++) {
                    const pixelValue = spriteRow & (1 << (7 - colI)) ? 1 : 0;

                    const drawX = (startX + colI) % 64;

                    if(video.drawPixel(drawX, drawY, pixelValue)) {
                        cpu.registers[15] = 1;
                    }
                }
            }
        }
    },
    {
        id: 'SKP_VX',
        name: 'SKP',
        mask: 0xf0ff, // instruction mask
        pattern: 0xE09E, // instruction pattern
        operands: [
            {
                mask: 0x0f00, // operand mask
                shift: 8,  // shift 8 bits right (2 nibbles) to get the value
            },
        ],
        execute(operands) {
            let [x] = operands;

            if(input.keyIsDown(cpu.registers[x])) {
                cpu.pc += 2;
            }
        }
    },
    {
        id: 'SKNP_VX',
        name: 'SKNP',
        mask: 0xf0ff, // instruction mask
        pattern: 0xE0A1, // instruction pattern
        operands: [
            {
                mask: 0x0f00, // operand mask
                shift: 8,  // shift 8 bits right (2 nibbles) to get the value
            },
        ],
        execute(operands) {
            let [x] = operands;

            if(!input.keyIsDown(cpu.registers[x])) {
                cpu.pc += 2;
            }
        }
    },
    {
        id: 'LD_VX_DT',
        name: 'LD',
        mask: 0xf0ff, // instruction mask
        pattern: 0xF007, // instruction pattern
        operands: [
            {
                mask: 0x0f00, // operand mask
                shift: 8,  // shift 8 bits right (2 nibbles) to get the value
            },
        ],
        execute(operands) {
            let [x] = operands;

            cpu.registers[x] = audio.delayTimer;
        }
    },
    {
        id: 'LD_VX_K',
        name: 'LD',
        mask: 0xf0ff, // instruction mask
        pattern: 0xF00A, // instruction pattern
        operands: [
            {
                mask: 0x0f00, // operand mask
                shift: 8,  // shift 8 bits right (2 nibbles) to get the value
            },
        ],
        execute(operands) {
            let [x] = operands;

            input.waitForKeyDown(x);
        }
    },
    {
        id: 'LD_DT_VX',
        name: 'LD',
        mask: 0xf0ff, // instruction mask
        pattern: 0xF015, // instruction pattern
        operands: [
            {
                mask: 0x0f00, // operand mask
                shift: 8,  // shift 8 bits right (2 nibbles) to get the value
            },
        ],
        execute(operands) {
            let [x] = operands;

            audio.delayTimer = cpu.registers[x];
        }
    },
    {
        id: 'LD_ST_VX',
        name: 'LD',
        mask: 0xf0ff, // instruction mask
        pattern: 0xF018, // instruction pattern
        operands: [
            {
                mask: 0x0f00, // operand mask
                shift: 8,  // shift 8 bits right (2 nibbles) to get the value
            },
        ],
        execute(operands) {
            let [x] = operands;

            audio.soundTimer = cpu.registers[x];
        }
    },
    {
        id: 'ADD_I_VX',
        name: 'ADD',
        mask: 0xf0ff, // instruction mask
        pattern: 0xF01E, // instruction pattern
        operands: [
            {
                mask: 0x0f00, // operand mask
                shift: 8,  // shift 8 bits right (2 nibbles) to get the value
            },
        ],
        execute(operands) {
            let [x] = operands;

            cpu.i += cpu.registers[x];
        }
    },
    {
        id: 'LD_F_VX',
        name: 'LD',
        mask: 0xf0ff, // instruction mask
        pattern: 0xF029, // instruction pattern
        operands: [
            {
                mask: 0x0f00, // operand mask
                shift: 8,  // shift 8 bits right (2 nibbles) to get the value
            },
        ],
        execute(operands) {
            let [x] = operands;

            cpu.i = cpu.registers[x] * 5;
        }
    },
    {
        id: 'LD_B_VX',
        name: 'LD',
        mask: 0xf0ff, // instruction mask
        pattern: 0xF033, // instruction pattern
        operands: [
            {
                mask: 0x0f00, // operand mask
                shift: 8,  // shift 8 bits right (2 nibbles) to get the value
            },
        ],
        execute(operands) {
            let [x] = operands;

            const value = cpu.registers[x].toString();
            memory[cpu.i] = Number(value.charAt(0) || 0);
            memory[cpu.i + 1] = Number(value.charAt(1) || 0);
            memory[cpu.i + 2] = Number(value.charAt(3) || 0);
        }
    },
    {
        id: 'LD_I_VX',
        name: 'LD',
        mask: 0xf0ff, // instruction mask
        pattern: 0xF055, // instruction pattern
        operands: [
            {
                mask: 0x0f00, // operand mask
                shift: 8,  // shift 8 bits right (2 nibbles) to get the value
            },
        ],
        execute(operands) {
            let [x] = operands;

            for(let i = 0; i < x; i++) {
                memory[cpu.i + i] = cpu.registers[i];
            }
        }
    },
    {
        id: 'LD_VX_I',
        name: 'LD',
        mask: 0xf0ff, // instruction mask
        pattern: 0xF065, // instruction pattern
        operands: [
            {
                mask: 0x0f00, // operand mask
                shift: 8,  // shift 8 bits right (2 nibbles) to get the value
            },
        ],
        execute(operands) {
            let [x] = operands;

            for(let i = 0; i < x; i++) {
                cpu.registers[i] = memory[cpu.i + i];
            }
        }
    },
]
