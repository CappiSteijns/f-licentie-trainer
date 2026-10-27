//go:build windows

package main

import "os/exec"

func openBrowser(u string) { _ = exec.Command("rundll32", "url.dll,FileProtocolHandler", u).Start() }
