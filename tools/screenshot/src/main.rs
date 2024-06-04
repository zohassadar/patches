mod input;
mod labels;
mod util;
mod video;

extern crate image;
use rustico_core::nes::NesState;
use rustico_core::palettes::NTSC_PAL;
// https://github.com/zeta0134/rustico/blob/e1ee2211cc6173fe2df0df036c9c2a30e9966136/cli/src/main.rs#L198
fn save_screenshot(nes: &NesState, output_path: &str) {
    let mut img = image::ImageBuffer::new(256, 240);
    for x in 0..256 {
        for y in 0..240 {
            let palette_index = ((nes.ppu.screen[y * 256 + x]) as usize) * 3;
            img.put_pixel(
                x as u32,
                y as u32,
                image::Rgba([
                    NTSC_PAL[palette_index + 0],
                    NTSC_PAL[palette_index + 1],
                    NTSC_PAL[palette_index + 2],
                    255 as u8,
                ]),
            );
        }
    }

    image::ImageRgba8(img).save(output_path).unwrap();

    println!("Saved screenshot to {}", output_path);
}

fn main() {
    let mut emu = util::emulator(None);
    let mut view = video::Video::new();

    let main_loop = labels::get("@mainLoop");
    let practise_type = labels::get("gameType") as usize;
    let game_mode = labels::get("gameMode") as usize;
    let start_level = labels::get("player1_startLevel") as usize;
    let b_modifier = labels::get("player1_startHeight") as usize;

    // spend a few frames bootstrapping
    for _ in 0..11 {
        emu.run_until_vblank();
    }
    view.render(&mut emu);
    for _ in 0..30 {
        emu.run_until_vblank();
    }

    emu.registers.pc = main_loop;
    emu.memory.iram_raw[game_mode] = 1;
    for _ in 0..4 {
        emu.run_until_vblank();
    }
    view.render(&mut emu);
    for _ in 0..30 {
        emu.run_until_vblank();
    }

    emu.registers.pc = main_loop;
    emu.memory.iram_raw[game_mode] = 2;
    for _ in 0..4 {
        emu.run_until_vblank();
    }
    view.render(&mut emu);
    for _ in 0..30 {
        emu.run_until_vblank();
    }

    emu.registers.pc = main_loop;
    emu.memory.iram_raw[game_mode] = 3;
    for _ in 0..5 {
        emu.run_until_vblank();
    }
    view.render(&mut emu);
    for _ in 0..30 {
        emu.run_until_vblank();
    }

    emu.memory.iram_raw[game_mode] = 4;
    emu.memory.iram_raw[practise_type] = 1;
    emu.memory.iram_raw[start_level] = 18;
    emu.memory.iram_raw[b_modifier] = 5;

    emu.registers.pc = main_loop;
    for _ in 0..22 {
        emu.run_until_vblank();
    }
    view.render(&mut emu);
    for _ in 0..30 {
        emu.run_until_vblank();
    }
}
