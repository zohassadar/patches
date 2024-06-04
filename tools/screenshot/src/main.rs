mod input;
mod labels;
mod util;
mod video;
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
