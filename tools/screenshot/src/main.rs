use std::env;
use std::fs::File;
use std::io::Read;
use std::path::MAIN_SEPARATOR_STR;
mod input;
mod labels;
mod util;

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
    let args: Vec<String> = env::args().collect();
    if args.len() != 3 {
        eprintln!("Need to pass rompath & output dir as args");
        std::process::exit(1)
    };
    let rom_path = &args[1];
    println!("This is rom_path: {:#?}", rom_path);

    let output_path = &args[2];
    println!("This is the output_path: {}", output_path);



    let (_file_path, file_name) = rom_path.rsplit_once(MAIN_SEPARATOR_STR).unwrap();
    println!("This is the file_name: {:#?}", file_name);
    println!("This is the _file_path: {:#?}", _file_path);

    let output = [output_path, file_name].join(MAIN_SEPARATOR_STR);
    println!("This is the output: {}", output);

    let mut f = File::open(rom_path).unwrap_or_else(|error| {
        panic!("Problem: {:?}", error);
    });
    let mut rom = Vec::new();
    f.read_to_end(&mut rom).unwrap_or_else(|error| {
        panic!("Problem: {:?}", error);
    });

    let mut emu = util::emulator(Some(&rom));

    let main_loop = labels::get("@mainLoop");
    let practise_type = labels::get("gameType") as usize;
    let game_mode = labels::get("gameMode") as usize;
    let start_level = labels::get("player1_startLevel") as usize;
    let b_modifier = labels::get("player1_startHeight") as usize;

    // spend a few frames bootstrapping
    for _ in 0..11 {
        emu.run_until_vblank();
    }
    save_screenshot(&emu, &output.replace(".nes", "_legal.png"));

    emu.registers.pc = main_loop;
    emu.memory.iram_raw[game_mode] = 1;
    for _ in 0..4 {
        emu.run_until_vblank();
    }
    save_screenshot(&emu, &output.replace(".nes", "_title.png"));

    emu.registers.pc = main_loop;
    emu.memory.iram_raw[game_mode] = 2;
    for _ in 0..4 {
        emu.run_until_vblank();
    }
    save_screenshot(&emu, &output.replace(".nes", "_gamemenu.png"));

    emu.registers.pc = main_loop;
    emu.memory.iram_raw[game_mode] = 3;
    for _ in 0..5 {
        emu.run_until_vblank();
    }
    save_screenshot(&emu, &output.replace(".nes", "_levelmenu.png"));

    emu.memory.iram_raw[game_mode] = 4;
    emu.memory.iram_raw[practise_type] = 1;
    emu.memory.iram_raw[start_level] = 18;
    emu.memory.iram_raw[b_modifier] = 5;

    emu.registers.pc = main_loop;
    for _ in 0..22 {
        emu.run_until_vblank();
    }
    save_screenshot(&emu, &output.replace(".nes", "_game.png"));
}
