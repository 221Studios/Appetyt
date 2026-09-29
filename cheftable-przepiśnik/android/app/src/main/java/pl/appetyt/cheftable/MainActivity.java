package pl.appetyt.cheftable;

import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import android.view.View;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().setBackgroundDrawable(new ColorDrawable(Color.rgb(17, 18, 18)));
        getWindow().setStatusBarColor(Color.rgb(17, 18, 18));
        getWindow().setNavigationBarColor(Color.rgb(17, 18, 18));

        int systemUiVisibility = getWindow().getDecorView().getSystemUiVisibility();
        systemUiVisibility &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
        systemUiVisibility &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
        getWindow().getDecorView().setSystemUiVisibility(systemUiVisibility);
    }
}
